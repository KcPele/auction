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
import { NotificationType } from '../../common/enums/notification-type.enum';
import { PlatformFeeSetting } from '../admin/entities/platform-fee-setting.entity';
import { BiddingSetting } from '../admin/entities/bidding-setting.entity';
import { EscrowSetting } from '../admin/entities/escrow-setting.entity';
import { Bid } from '../bids/entities/bid.entity';
import { CarListing } from '../cars/entities/car-listing.entity';
import { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Watchlist } from '../users/entities/watchlist.entity';
import { BidsGateway } from '../bids/bids.gateway';
import { WalletsService } from '../wallets/wallets.service';
import { AuctionLifecycleScheduler } from './auction-lifecycle.scheduler';
import { AuctionCatalogQuery } from './auction-catalog.query';
import { CancelAuctionDto } from './dto/cancel-auction.dto';
import { ListAuctionsQueryDto } from './dto/list-auctions-query.dto';
import { Auction } from './entities/auction.entity';
import { presentAuction } from './presenters/auction.presenter';
import {
  createLifecycleNotifications,
  findClosableBids,
  markLosingBids,
  scheduleOpenLifecycleJobs,
  type LifecycleNotification,
} from './auction-lifecycle.helpers';

type AuctionListing = CarListing | GadgetListing;
@Injectable()
export class AuctionsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuctionsService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Auction)
    private readonly auctionsRepository: Repository<Auction>,
    @InjectRepository(Watchlist)
    private readonly watchlistRepository: Repository<Watchlist>,
    @InjectRepository(Bid)
    private readonly bidsRepository: Repository<Bid>,
    @InjectRepository(CarListing)
    private readonly carListingsRepository: Repository<CarListing>,
    @InjectRepository(GadgetListing)
    private readonly gadgetListingsRepository: Repository<GadgetListing>,
    @InjectRepository(PlatformFeeSetting)
    private readonly feesRepository: Repository<PlatformFeeSetting>,
    @InjectRepository(BiddingSetting)
    private readonly biddingSettingsRepository: Repository<BiddingSetting>,
    @InjectRepository(EscrowSetting)
    private readonly escrowSettingsRepository: Repository<EscrowSetting>,
    private readonly catalog: AuctionCatalogQuery,
    private readonly notificationsService: NotificationsService,
    private readonly lifecycleScheduler: AuctionLifecycleScheduler,
    private readonly bidsGateway: BidsGateway,
    private readonly walletsService: WalletsService,
  ) {}

  async onApplicationBootstrap() {
    await scheduleOpenLifecycleJobs(
      this.auctionsRepository,
      this.lifecycleScheduler,
    );
  }

  async createFromApprovedListing(
    category: ListingCategory,
    listingId: string,
    manager?: EntityManager,
  ) {
    const auctionsRepository =
      manager?.getRepository(Auction) ?? this.auctionsRepository;
    const existing = await auctionsRepository.findOneBy({
      category,
      listingId,
    });

    if (existing) {
      return { auction: presentAuction(existing), created: false };
    }

    const listing = await this.findApprovedListing(category, listingId, manager);
    const fee = await this.findFee(category, manager);
    const biddingSetting = await this.findBiddingSetting(manager);
    const endTime = new Date(
      listing.startTime.getTime() + listing.durationMinutes * 60_000,
    );
    const auction = await auctionsRepository.save(
      auctionsRepository.create({
        category,
        listingId: listing.id,
        sellerId: listing.listerId,
        basePriceKobo: Number(listing.basePriceKobo),
        minimumBidIncrementKobo: Number(listing.minimumBidIncrementKobo),
        holdPercent: Math.max(
          listing.holdPercent,
          biddingSetting.bidRequirementPercent,
        ),
        sellerFeeBps: fee.sellerFeeBps,
        buyerFeeBps: fee.buyerFeeBps,
        startTime: listing.startTime,
        durationMinutes: listing.durationMinutes,
        endTime,
        status: AuctionStatus.Scheduled,
      }),
    );
    if (!manager) {
      await this.lifecycleScheduler.scheduleAuctionLifecycle(auction);
    }

    return { auction: presentAuction(auction), created: true };
  }

  async scheduleApprovedAuction(auctionId: string) {
    const auction = await this.findAuction(auctionId);
    await this.lifecycleScheduler.scheduleAuctionLifecycle(auction);
  }

  async list(query: ListAuctionsQueryDto) {
    return this.catalog.list(query);
  }

  async findOne(id: string) {
    return this.catalog.findOne(id);
  }

  async listBids(auctionId: string) {
    return this.catalog.listBids(auctionId);
  }

  async cancel(adminId: string, auctionId: string, dto: CancelAuctionDto) {
    const result = await this.dataSource.transaction(async (manager) => {
      const current = await this.findAuctionForUpdate(manager, auctionId);
      const previousStatus = current.status;

      if (
        ![AuctionStatus.Scheduled, AuctionStatus.Live].includes(current.status)
      ) {
        throw new BadRequestException(
          'Only scheduled or live auctions can be cancelled',
        );
      }

      const bids = await manager.find(Bid, {
        where: { auctionId: current.id },
        select: ['bidderId'],
      });
      const bidderIds = [...new Set(bids.map((bid) => bid.bidderId))];

      if (current.currentWinningBidId) {
        const winningBid = await manager.findOne(Bid, {
          where: { id: current.currentWinningBidId },
          lock: { mode: 'pessimistic_write' },
        });
        if (winningBid?.walletHoldId) {
          await this.walletsService.releaseBidHold(manager, {
            holdId: winningBid.walletHoldId,
            reference: `auction_cancel_${current.id}_bid_${winningBid.id}`,
            metadata: {
              auctionId: current.id,
              bidId: winningBid.id,
              reason: 'auction_cancelled',
            },
          });
        }
      }

      await manager.update(
        Bid,
        { auctionId: current.id },
        { status: BidStatus.Cancelled },
      );
      Object.assign(current, {
        status: AuctionStatus.Cancelled,
        currentWinningBidId: null,
        winnerId: null,
        cancelledById: adminId,
        cancellationReason: dto.reason?.trim() ?? null,
        cancelledAt: new Date(),
      });

      return {
        auction: await manager.save(current),
        bidderIds,
        previousStatus,
      };
    });

    this.bidsGateway.emitStatusChanged({
      auctionId: result.auction.id,
      previousStatus: result.previousStatus,
      newStatus: AuctionStatus.Cancelled,
    });

    const reason = result.auction.cancellationReason
      ? ` Reason: ${result.auction.cancellationReason}`
      : '';
    await createLifecycleNotifications(this.notificationsService, this.logger, [
      {
        recipientId: result.auction.sellerId,
        type: NotificationType.System,
        title: 'Auction cancelled',
        message: `Your auction was cancelled by an administrator.${reason}`,
        data: { auctionId: result.auction.id },
      },
      ...result.bidderIds
        .filter((bidderId) => bidderId !== result.auction.sellerId)
        .map((bidderId) => ({
          recipientId: bidderId,
          type: NotificationType.System,
          title: 'Auction cancelled',
          message: `An auction you bid on was cancelled. Your active hold has been released.${reason}`,
          data: { auctionId: result.auction.id },
        })),
    ]);

    return { auction: presentAuction(result.auction) };
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
      this.bidsGateway.emitStatusChanged({
        auctionId: result.auction.id,
        previousStatus: AuctionStatus.Scheduled,
        newStatus: AuctionStatus.Live,
      });

      await createLifecycleNotifications(this.notificationsService, this.logger, [
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

  async sendStartingSoonReminders(auctionId: string) {
    const auction = await this.auctionsRepository.findOneBy({ id: auctionId });
    if (!auction || auction.status !== AuctionStatus.Scheduled) {
      return { notified: 0 };
    }

    const entries = await this.watchlistRepository.find({ where: { auctionId } });
    await createLifecycleNotifications(
      this.notificationsService,
      this.logger,
      entries.map((entry) => ({
        recipientId: entry.userId,
        type: NotificationType.System,
        title: 'Auction starts in 15 minutes',
        message: 'An auction you saved is about to open for bidding.',
        data: { auctionId, source: 'WATCHLIST_REMINDER' },
      })),
    );
    return { notified: entries.length };
  }

  async forceCloseAuction(auctionId: string) {
    // Bump endTime into the past so closeAuction runs the real settlement
    // path. Idempotent — closeAuction is a no-op on already-closed auctions.
    await this.auctionsRepository
      .createQueryBuilder()
      .update()
      .set({ endTime: () => 'NOW() - INTERVAL \'1 second\'' })
      .where('id = :id', { id: auctionId })
      .andWhere('status IN (:...statuses)', {
        statuses: [AuctionStatus.Scheduled, AuctionStatus.Live],
      })
      .execute();
    return this.closeAuction(auctionId);
  }

  async closeAuction(auctionId: string) {
    const paymentWindowHours =
      (await this.escrowSettingsRepository.findOneBy({ id: 'default' }))
        ?.paymentWindowHours ?? 24;
    const result = await this.dataSource.transaction(async (manager) => {
      const auction = await this.findAuctionForUpdate(manager, auctionId);
      const previousStatus = auction.status;

      if (
        ![AuctionStatus.Scheduled, AuctionStatus.Live].includes(auction.status)
      ) {
        return {
          auction,
          winningBid: null,
          changed: false,
          previousStatus,
          notifications: [] as LifecycleNotification[],
        };
      }

      if (auction.endTime.getTime() > Date.now()) {
        await this.lifecycleScheduler.scheduleAuctionClose(auction);
        return {
          auction,
          winningBid: null,
          changed: false,
          previousStatus,
          notifications: [] as LifecycleNotification[],
        };
      }

      const bids = await findClosableBids(manager, auction.id);
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
          previousStatus,
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
        Date.now() + paymentWindowHours * 60 * 60_000,
      );
      auction.status = AuctionStatus.AwaitingPayment;
      auction.currentWinningBidId = winningBid.id;
      auction.winnerId = winningBid.bidderId;
      auction.paymentDeadlineAt = paymentDeadlineAt;
      winningBid.status = BidStatus.Winning;

      await manager.save(winningBid);
      await markLosingBids(manager, this.walletsService, bids, winningBid);
      await manager.save(auction);

      return {
        auction,
        winningBid,
        changed: true,
        previousStatus,
        notifications: [
          {
            recipientId: winningBid.bidderId,
            type: NotificationType.AuctionWon,
            title: 'You won an auction',
            message: `Complete final payment within ${paymentWindowHours} hours to secure the item.`,
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
            message: `Your auction has ended and the winner has ${paymentWindowHours} hours to pay.`,
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
      this.bidsGateway.emitStatusChanged({
        auctionId: result.auction.id,
        previousStatus: result.previousStatus,
        newStatus: result.auction.status,
      });

      this.bidsGateway.emitAuctionClosed({
        auctionId: result.auction.id,
        winnerId: result.auction.winnerId,
        winningBid: result.winningBid
          ? { id: result.winningBid.id, amountKobo: result.winningBid.amountKobo }
          : null,
      });

      await createLifecycleNotifications(
        this.notificationsService,
        this.logger,
        result.notifications,
      );

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
    manager?: EntityManager,
  ): Promise<AuctionListing> {
    const repository = manager
      ? manager.getRepository(
          category === ListingCategory.Car ? CarListing : GadgetListing,
        )
      : this.getListingRepository(category);
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

  private async findFee(category: ListingCategory, manager?: EntityManager) {
    const repository =
      manager?.getRepository(PlatformFeeSetting) ?? this.feesRepository;
    const existing = await repository.findOneBy({ category });

    return existing ?? DefaultPlatformFees[category];
  }

  private async findBiddingSetting(manager?: EntityManager) {
    const repository =
      manager?.getRepository(BiddingSetting) ?? this.biddingSettingsRepository;
    const existing = await repository.findOneBy({
      id: 'default',
    });

    return existing ?? { bidRequirementPercent: 10 };
  }

}
