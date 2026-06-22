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
import { BiddingSetting } from '../admin/entities/bidding-setting.entity';
import { Bid } from '../bids/entities/bid.entity';
import { CarListing } from '../cars/entities/car-listing.entity';
import { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { BidsGateway } from '../bids/bids.gateway';
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
    @InjectRepository(BiddingSetting)
    private readonly biddingSettingsRepository: Repository<BiddingSetting>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly lifecycleScheduler: AuctionLifecycleScheduler,
    private readonly bidsGateway: BidsGateway,
    private readonly walletsService: WalletsService,
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
    const biddingSetting = await this.findBiddingSetting();
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
        holdPercent: biddingSetting.bidRequirementPercent,
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
    let auctionIds: string[] | null = null;

    if (query.search) {
      auctionIds = await this.searchAuctionIds(query.search);
      if (auctionIds.length === 0) {
        return { auctions: [] };
      }
    }

    // Year filter applies only to cars — pre-resolve matching listing IDs and
    // narrow the auction ID set before the main query.
    if (
      (query.minYear || query.maxYear) &&
      query.category !== ListingCategory.Gadget
    ) {
      const yearQb = this.carListingsRepository
        .createQueryBuilder('c')
        .select('c.id');
      if (query.minYear) yearQb.andWhere('c.year >= :minY', { minY: query.minYear });
      if (query.maxYear) yearQb.andWhere('c.year <= :maxY', { maxY: query.maxYear });
      const carIds = (await yearQb.getMany()).map((c) => c.id);
      if (carIds.length === 0) {
        return { auctions: [] };
      }
      const yearAuctions = await this.auctionsRepository.find({
        where: { category: ListingCategory.Car, listingId: In(carIds) },
        select: ['id'],
      });
      const yearIds = yearAuctions.map((a) => a.id);
      auctionIds = auctionIds
        ? auctionIds.filter((id) => yearIds.includes(id))
        : yearIds;
      if (auctionIds.length === 0) {
        return { auctions: [] };
      }
    }

    const qb = this.auctionsRepository
      .createQueryBuilder('a')
      .orderBy('a.startTime', 'ASC')
      .addOrderBy('a.createdAt', 'DESC')
      .take(query.limit)
      .skip(query.offset);
    if (query.category) qb.andWhere('a.category = :cat', { cat: query.category });
    if (query.status) qb.andWhere('a.status = :st', { st: query.status });
    if (auctionIds) qb.andWhere('a.id IN (:...ids)', { ids: auctionIds });
    if (query.minPriceKobo != null)
      qb.andWhere('a."basePriceKobo" >= :minP', { minP: query.minPriceKobo });
    if (query.maxPriceKobo != null)
      qb.andWhere('a."basePriceKobo" <= :maxP', { maxP: query.maxPriceKobo });
    const auctions = await qb.getMany();

    // Hydrate display title/subtitle/cover from the underlying listing so the
    // browse cards can show the make/model/year without a per-card fetch.
    const carIds = auctions
      .filter((a) => a.category === ListingCategory.Car)
      .map((a) => a.listingId);
    const gadgetIds = auctions
      .filter((a) => a.category === ListingCategory.Gadget)
      .map((a) => a.listingId);
    const [cars, gadgets] = await Promise.all([
      carIds.length
        ? this.carListingsRepository.find({ where: { id: In(carIds) } })
        : Promise.resolve([] as CarListing[]),
      gadgetIds.length
        ? this.gadgetListingsRepository.find({ where: { id: In(gadgetIds) } })
        : Promise.resolve([] as GadgetListing[]),
    ]);
    const carMap = new Map(cars.map((c) => [c.id, c]));
    const gadgetMap = new Map(gadgets.map((g) => [g.id, g]));

    return {
      auctions: auctions.map((a) => {
        const base = presentAuction(a);
        if (a.category === ListingCategory.Car) {
          const c = carMap.get(a.listingId);
          if (c) {
            return {
              ...base,
              title: `${c.year} ${c.make} ${c.model}`.trim(),
              subtitle: [c.condition, `${c.mileage.toLocaleString()} km`]
                .filter(Boolean)
                .join(' · '),
              coverUrl: c.photoUrls?.[0] ?? null,
            };
          }
        } else {
          const g = gadgetMap.get(a.listingId);
          if (g) {
            return {
              ...base,
              title: `${g.brand} ${g.model}`.trim(),
              subtitle: [
                g.type,
                g.batteryHealthPercent
                  ? `${g.batteryHealthPercent}% battery`
                  : null,
              ]
                .filter(Boolean)
                .join(' · '),
              coverUrl: g.photoUrls?.[0] ?? null,
            };
          }
        }
        return base;
      }),
    };
  }

  async findOne(id: string) {
    const auction = await this.findAuction(id);
    const listing = await this.findListing(auction.category, auction.listingId);

    return {
      auction: presentAuction(auction),
      listing: listing ? this.presentListing(auction.category, listing) : null,
    };
  }

  async listBids(auctionId: string) {
    await this.findAuction(auctionId);
    const bids = await this.bidsRepository.find({
      where: { auctionId },
      order: { createdAt: 'DESC' },
    });

    if (bids.length === 0) {
      return { bids: [] };
    }

    const bidderIds = [...new Set(bids.map((b) => b.bidderId))];
    const users = await this.usersRepository.find({
      where: { id: In(bidderIds) },
      select: ['id', 'firstName', 'lastName'],
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedBids = bids.map((bid) => {
      const bidder = userMap.get(bid.bidderId);
      const handle = bidder
        ? `@${bidder.firstName.toLowerCase()}***`
        : '@unknown';

      return {
        id: bid.id,
        userId: bid.bidderId,
        handle,
        amountKobo: bid.amountKobo,
        placedAt: bid.createdAt,
        isLeading:
          bid.status === BidStatus.Winning || bid.status === BidStatus.Accepted,
        status: bid.status,
      };
    });

    return { bids: enrichedBids };
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
      this.bidsGateway.emitStatusChanged({
        auctionId: result.auction.id,
        previousStatus: AuctionStatus.Scheduled,
        newStatus: AuctionStatus.Live,
      });

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
      await this.markLosingBids(manager, bids, winningBid);
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
      const previousStatus = result.auction.status === AuctionStatus.Ended
        ? AuctionStatus.Live
        : AuctionStatus.Scheduled;

      this.bidsGateway.emitStatusChanged({
        auctionId: result.auction.id,
        previousStatus,
        newStatus: result.auction.status,
      });

      this.bidsGateway.emitAuctionClosed({
        auctionId: result.auction.id,
        winnerId: result.auction.winnerId,
        winningBid: result.winningBid
          ? { id: result.winningBid.id, amountKobo: result.winningBid.amountKobo }
          : null,
      });

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

  private async searchAuctionIds(keyword: string): Promise<string[]> {
    const term = `%${keyword}%`;
    const carResults = await this.carListingsRepository
      .createQueryBuilder('car')
      .select('car.id', 'listingId')
      .where(
        'car.make ILIKE :term OR car.model ILIKE :term OR car.colour ILIKE :term OR CAST(car.year AS TEXT) ILIKE :term',
        { term },
      )
      .getRawMany();

    const gadgetResults = await this.gadgetListingsRepository
      .createQueryBuilder('gadget')
      .select('gadget.id', 'listingId')
      .where(
        'gadget.brand ILIKE :term OR gadget.model ILIKE :term OR gadget.type ILIKE :term OR gadget.colour ILIKE :term',
        { term },
      )
      .getRawMany();

    const listingIds = [
      ...carResults.map((r) => r.listingId),
      ...gadgetResults.map((r) => r.listingId),
    ];

    if (listingIds.length === 0) return [];

    const auctions = await this.auctionsRepository.find({
      where: { listingId: In(listingIds) },
      select: ['id'],
    });

    return auctions.map((a) => a.id);
  }

  private async findListing(category: ListingCategory, listingId: string) {
    const repo = this.getListingRepository(category);
    return repo.findOneBy({ id: listingId });
  }

  private presentListing(
    category: ListingCategory,
    listing: CarListing | GadgetListing,
  ) {
    if (category === ListingCategory.Car) {
      const car = listing as CarListing;
      return {
        id: car.id,
        type: 'car',
        make: car.make,
        model: car.model,
        year: car.year,
        colour: car.colour,
        registrationNumber: car.registrationNumber,
        mileage: car.mileage,
        condition: car.condition,
        knownFaults: car.knownFaults,
        mechanicId: car.mechanicId,
        photoUrls: car.photoUrls,
        videoUrls: car.videoUrls ?? [],
        basePriceKobo: Number(car.basePriceKobo),
        status: car.status,
        reviewedById: car.reviewedById,
        reviewNote: car.reviewNote,
        reviewedAt: car.reviewedAt,
        createdAt: car.createdAt,
        updatedAt: car.updatedAt,
      };
    }

    const gadget = listing as GadgetListing;
    return {
      id: gadget.id,
      type: 'gadget',
      gadgetType: gadget.type,
      brand: gadget.brand,
      model: gadget.model,
      colour: gadget.colour,
      batteryHealthPercent: gadget.batteryHealthPercent,
      specs: gadget.specs,
      usageHistory: gadget.usageHistory,
      defects: gadget.defects,
      proofDocumentUrl: gadget.proofDocumentUrl,
      photoUrls: gadget.photoUrls,
      videoUrls: gadget.videoUrls,
      basePriceKobo: Number(gadget.basePriceKobo),
      status: gadget.status,
      reviewedById: gadget.reviewedById,
      reviewNote: gadget.reviewNote,
      reviewedAt: gadget.reviewedAt,
      createdAt: gadget.createdAt,
      updatedAt: gadget.updatedAt,
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

  private async findBiddingSetting() {
    const existing = await this.biddingSettingsRepository.findOneBy({
      id: 'default',
    });

    return existing ?? { bidRequirementPercent: 10 };
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

  private async markLosingBids(
    manager: EntityManager,
    bids: Bid[],
    winningBid: Bid,
  ) {
    const losingBids = bids.filter((bid) => bid.id !== winningBid.id);

    for (const bid of losingBids) {
      bid.status = BidStatus.Outbid;
      await manager.save(bid);
      // Release the bidder's hold so their wallet frees up the moment the
      // auction closes. Idempotent — releaseBidHold no-ops if not active.
      if (bid.walletHoldId) {
        await this.walletsService.releaseBidHold(manager, {
          holdId: bid.walletHoldId,
          reference: `auction_close_${winningBid.auctionId}_bid_${bid.id}`,
          metadata: {
            auctionId: winningBid.auctionId,
            bidId: bid.id,
            reason: 'auction_closed',
          },
        });
      }
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
