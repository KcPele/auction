import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { DefaultPlatformFees } from '../../common/constants/platform-fees';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { BidStatus } from '../../common/enums/bid-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { ListingStatus } from '../../common/enums/listing-status.enum';
import { NotificationAudience } from '../../common/enums/notification-audience.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { PlatformFeeSetting } from '../admin/entities/platform-fee-setting.entity';
import { Bid } from '../bids/entities/bid.entity';
import { CarListing } from '../cars/entities/car-listing.entity';
import { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletsService } from '../wallets/wallets.service';
import { AuctionLifecycleScheduler } from './auction-lifecycle.scheduler';
import { CancelAuctionDto } from './dto/cancel-auction.dto';
import { ListAuctionsQueryDto } from './dto/list-auctions-query.dto';
import { Auction } from './entities/auction.entity';
import { presentAuction } from './presenters/auction.presenter';

type AuctionListing = CarListing | GadgetListing;
type LifecycleNotification = {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
};

@Injectable()
export class AuctionsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuctionsService.name);
  private readonly paymentDeadlineHours = 24;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Auction)
    private readonly auctionsRepository: Repository<Auction>,
    @InjectRepository(Bid)
    private readonly bidsRepository: Repository<Bid>,
    @InjectRepository(CarListing)
    private readonly carListingsRepository: Repository<CarListing>,
    @InjectRepository(GadgetListing)
    private readonly gadgetListingsRepository: Repository<GadgetListing>,
    @InjectRepository(PlatformFeeSetting)
    private readonly feesRepository: Repository<PlatformFeeSetting>,
    private readonly walletsService: WalletsService,
    private readonly notificationsService: NotificationsService,
    private readonly lifecycleScheduler: AuctionLifecycleScheduler,
  ) {}

  async onApplicationBootstrap() {
    await this.scheduleOpenLifecycleJobs();
  }

  async createFromApprovedListing(category: ListingCategory, listingId: string) {
    const existing = await this.auctionsRepository.findOneBy({
      category,
      listingId,
    });

    if (existing) {
      return { auction: presentAuction(existing), created: false };
    }

    const listing = await this.findApprovedListing(category, listingId);
    const fee = await this.findFee(category);
    const endTime = new Date(
      listing.startTime.getTime() + listing.durationMinutes * 60_000,
    );
    const auction = await this.auctionsRepository.save(
      this.auctionsRepository.create({
        category,
        listingId: listing.id,
        sellerId: listing.listerId,
        basePriceKobo: Number(listing.basePriceKobo),
        minimumBidIncrementKobo: Number(listing.minimumBidIncrementKobo),
        holdPercent: listing.holdPercent,
        sellerFeeBps: fee.sellerFeeBps,
        buyerFeeBps: fee.buyerFeeBps,
        startTime: listing.startTime,
        durationMinutes: listing.durationMinutes,
        endTime,
        status: AuctionStatus.Scheduled,
      }),
    );
    await this.lifecycleScheduler.scheduleAuctionLifecycle(auction);

    return { auction: presentAuction(auction), created: true };
  }

  async list(query: ListAuctionsQueryDto) {
    const where = {
      ...(query.category ? { category: query.category } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const auctions = await this.auctionsRepository.find({
      where,
      order: { startTime: 'ASC', createdAt: 'DESC' },
      take: query.limit,
      skip: query.offset,
    });

    return { auctions: auctions.map(presentAuction) };
  }

  async findOne(id: string) {
    return { auction: presentAuction(await this.findAuction(id)) };
  }

  async listBids(auctionId: string) {
    await this.findAuction(auctionId);
    const bids = await this.bidsRepository.find({
      where: { auctionId },
      order: { amountKobo: 'DESC', createdAt: 'ASC' },
    });

    return { bids };
  }

  async cancel(adminId: string, auctionId: string, dto: CancelAuctionDto) {
    const auction = await this.findAuction(auctionId);

    if (
      ![AuctionStatus.Scheduled, AuctionStatus.Live].includes(auction.status)
    ) {
      throw new BadRequestException('Only scheduled or live auctions can be cancelled');
    }

    Object.assign(auction, {
      status: AuctionStatus.Cancelled,
      cancelledById: adminId,
      cancellationReason: dto.reason?.trim() ?? null,
      cancelledAt: new Date(),
    });

    return {
      auction: presentAuction(await this.auctionsRepository.save(auction)),
    };
  }

  async startScheduledAuction(auctionId: string) {
    const result = await this.dataSource.transaction(async (manager) => {
      const auction = await this.findAuctionForUpdate(manager, auctionId);

      if (auction.status !== AuctionStatus.Scheduled) {
        return { auction, changed: false };
      }

      const now = new Date();

      if (auction.startTime.getTime() > now.getTime()) {
        await this.lifecycleScheduler.scheduleAuctionStart(auction);
        return { auction, changed: false };
      }

      auction.status = AuctionStatus.Live;
      await manager.save(auction);

      return { auction, changed: true };
    });

    if (result.changed) {
      await this.createLifecycleNotifications([
        {
          recipientId: result.auction.sellerId,
          type: NotificationType.AuctionStarted,
          title: 'Auction started',
          message: 'Your approved listing is now live for bidding.',
          data: { auctionId: result.auction.id },
        },
      ]);
    }

    await this.lifecycleScheduler.scheduleAuctionClose(result.auction);

    return {
      auction: presentAuction(result.auction),
      changed: result.changed,
    };
  }

  async closeAuction(auctionId: string) {
    const result = await this.dataSource.transaction(async (manager) => {
      const auction = await this.findAuctionForUpdate(manager, auctionId);

      if (
        ![AuctionStatus.Scheduled, AuctionStatus.Live].includes(auction.status)
      ) {
        return {
          auction,
          winningBid: null,
          changed: false,
          notifications: [] as LifecycleNotification[],
        };
      }

      if (auction.endTime.getTime() > Date.now()) {
        await this.lifecycleScheduler.scheduleAuctionClose(auction);
        return {
          auction,
          winningBid: null,
          changed: false,
          notifications: [] as LifecycleNotification[],
        };
      }

      const bids = await this.findClosableBids(manager, auction.id);
      const winningBid = bids[0] ?? null;

      if (!winningBid) {
        auction.status = AuctionStatus.Ended;
        auction.currentWinningBidId = null;
        auction.winnerId = null;
        auction.paymentDeadlineAt = null;
        await manager.save(auction);

        return {
          auction,
          winningBid,
          changed: true,
          notifications: [
            {
              recipientId: auction.sellerId,
              type: NotificationType.System,
              title: 'Auction ended',
              message: 'Your auction ended without a winning bid.',
              data: { auctionId: auction.id },
            },
          ],
        };
      }

      const paymentDeadlineAt = new Date(
        Date.now() + this.paymentDeadlineHours * 60 * 60_000,
      );
      auction.status = AuctionStatus.AwaitingPayment;
      auction.currentWinningBidId = winningBid.id;
      auction.winnerId = winningBid.bidderId;
      auction.paymentDeadlineAt = paymentDeadlineAt;
      winningBid.status = BidStatus.Winning;

      await manager.save(winningBid);
      await this.releaseLosingBidHolds(manager, auction, bids, winningBid);
      await manager.save(auction);

      return {
        auction,
        winningBid,
        changed: true,
        notifications: [
          {
            recipientId: winningBid.bidderId,
            type: NotificationType.AuctionWon,
            title: 'You won an auction',
            message: 'Complete final payment within 24 hours to secure the item.',
            data: {
              auctionId: auction.id,
              bidId: winningBid.id,
              amountKobo: winningBid.amountKobo,
              paymentDeadlineAt,
            },
          },
          {
            recipientId: auction.sellerId,
            type: NotificationType.System,
            title: 'Auction has a winner',
            message: 'Your auction has ended and the winner has 24 hours to pay.',
            data: {
              auctionId: auction.id,
              winningBidId: winningBid.id,
              winnerId: winningBid.bidderId,
            },
          },
        ],
      };
    });

    if (result.changed) {
      await this.createLifecycleNotifications(result.notifications);

      if (result.winningBid && result.auction.paymentDeadlineAt) {
        await this.lifecycleScheduler.schedulePaymentDeadline(result.auction);
      }
    }

    return {
      auction: presentAuction(result.auction),
      winningBid: result.winningBid,
      changed: result.changed,
    };
  }

  private async findAuction(id: string) {
    const auction = await this.auctionsRepository.findOneBy({ id });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    return auction;
  }

  private async findAuctionForUpdate(
    manager: EntityManager,
    auctionId: string,
  ) {
    const auction = await manager.findOne(Auction, {
      where: { id: auctionId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    return auction;
  }

  private async findApprovedListing(
    category: ListingCategory,
    listingId: string,
  ): Promise<AuctionListing> {
    const repository = this.getListingRepository(category);
    const listing = await repository.findOneBy({
      id: listingId,
      status: ListingStatus.Approved,
    });

    if (!listing) {
      throw new NotFoundException('Approved listing not found');
    }

    return listing;
  }

  private getListingRepository(category: ListingCategory) {
    return category === ListingCategory.Car
      ? this.carListingsRepository
      : this.gadgetListingsRepository;
  }

  private async findFee(category: ListingCategory) {
    const existing = await this.feesRepository.findOneBy({ category });

    return existing ?? DefaultPlatformFees[category];
  }

  private async scheduleOpenLifecycleJobs() {
    const auctions = await this.auctionsRepository.find({
      where: [
        { status: AuctionStatus.Scheduled },
        { status: AuctionStatus.Live },
      ],
    });

    await Promise.all(
      auctions.map((auction) =>
        this.lifecycleScheduler.scheduleAuctionLifecycle(auction),
      ),
    );
  }

  private async findClosableBids(manager: EntityManager, auctionId: string) {
    return manager.find(Bid, {
      where: {
        auctionId,
        status: In([BidStatus.Accepted, BidStatus.Winning]),
      },
      order: { amountKobo: 'DESC', createdAt: 'ASC' },
      lock: { mode: 'pessimistic_write' },
    });
  }

  private async releaseLosingBidHolds(
    manager: EntityManager,
    auction: Auction,
    bids: Bid[],
    winningBid: Bid,
  ) {
    const losingBids = bids.filter((bid) => bid.id !== winningBid.id);

    for (const bid of losingBids) {
      if (!bid.walletHoldId) {
        continue;
      }

      bid.status = BidStatus.Released;
      await manager.save(bid);
      await this.walletsService.releaseBidHold(manager, {
        holdId: bid.walletHoldId,
        reference: `auction_close_release_${bid.id}`,
        metadata: {
          auctionId: auction.id,
          bidId: bid.id,
          winningBidId: winningBid.id,
        },
      });
    }
  }

  private async createLifecycleNotifications(
    notifications: LifecycleNotification[],
  ) {
    for (const notification of notifications) {
      try {
        await this.notificationsService.create({
          audience: NotificationAudience.User,
          ...notification,
        });
      } catch (error) {
        this.logger.error(
          error instanceof Error
            ? error.message
            : 'Failed to create auction lifecycle notification',
        );
      }
    }
  }
}
