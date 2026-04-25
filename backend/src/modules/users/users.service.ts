import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { ListingAccessStatus } from '../../common/enums/listing-access-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { UserBidStatus } from '../../common/enums/user-bid-status.enum';
import { AccessCode } from '../admin/entities/access-code.entity';
import { Auction } from '../auctions/entities/auction.entity';
import { AuctionDelivery } from '../auctions/entities/auction-delivery.entity';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { BidStatus } from '../../common/enums/bid-status.enum';
import { CarListing } from '../cars/entities/car-listing.entity';
import { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
import { Bid } from '../bids/entities/bid.entity';
import { ApplyListingAccessDto } from './dto/apply-listing-access.dto';
import { ListUserBidsQueryDto } from './dto/list-user-bids-query.dto';
import { RedeemAccessCodeDto } from './dto/redeem-access-code.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ListingAccessApplication } from './entities/listing-access-application.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { UserListingPermission } from './entities/user-listing-permission.entity';
import { User } from './entities/user.entity';
import { Watchlist } from './entities/watchlist.entity';
import { presentUser } from './presenters/user.presenter';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(NotificationPreference)
    private readonly preferencesRepository: Repository<NotificationPreference>,
    @InjectRepository(ListingAccessApplication)
    private readonly applicationsRepository: Repository<ListingAccessApplication>,
    @InjectRepository(UserListingPermission)
    private readonly permissionsRepository: Repository<UserListingPermission>,
    @InjectRepository(AccessCode)
    private readonly accessCodesRepository: Repository<AccessCode>,
    @InjectRepository(Bid)
    private readonly bidsRepository: Repository<Bid>,
    @InjectRepository(Auction)
    private readonly auctionsRepository: Repository<Auction>,
    @InjectRepository(CarListing)
    private readonly carListingsRepository: Repository<CarListing>,
    @InjectRepository(GadgetListing)
    private readonly gadgetListingsRepository: Repository<GadgetListing>,
    @InjectRepository(Watchlist)
    private readonly watchlistRepository: Repository<Watchlist>,
    @InjectRepository(AuctionDelivery)
    private readonly deliveryRepository: Repository<AuctionDelivery>,
  ) {}

  async getMe(userId: string) {
    const user = await this.findActiveUser(userId);
    const preferences = await this.ensurePreferences(user.id);
    const permissions = await this.permissionsRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });

    return {
      user: presentUser(user),
      notificationPreferences: preferences,
      listingPermissions: permissions.map((p) => ({
        category: p.category,
        grantedAt: p.createdAt,
      })),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.findActiveUser(userId);

    if (dto.phone && dto.phone !== user.phone) {
      const existing = await this.usersRepository.findOneBy({
        phone: dto.phone,
      });

      if (existing) {
        throw new BadRequestException('Phone already exists');
      }
    }

    Object.assign(user, {
      firstName: dto.firstName?.trim() ?? user.firstName,
      lastName: dto.lastName?.trim() ?? user.lastName,
      phone: dto.phone ?? user.phone,
      nin: dto.nin ?? user.nin,
    });

    return { user: presentUser(await this.usersRepository.save(user)) };
  }

  async updateNotificationPreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ) {
    const preferences = await this.ensurePreferences(userId);

    Object.assign(preferences, {
      whatsappEnabled: dto.whatsappEnabled ?? preferences.whatsappEnabled,
      readyToBid: dto.readyToBid ?? preferences.readyToBid,
      emailEnabled: dto.emailEnabled ?? preferences.emailEnabled,
      pushEnabled: dto.pushEnabled ?? preferences.pushEnabled,
    });

    return {
      notificationPreferences:
        await this.preferencesRepository.save(preferences),
    };
  }

  async applyForListingAccess(userId: string, dto: ApplyListingAccessDto) {
    await this.findActiveUser(userId);

    const existingPermission = await this.permissionsRepository.findOneBy({
      userId,
      category: dto.category,
    });

    if (existingPermission) {
      throw new BadRequestException('Listing access already granted');
    }

    const pending = await this.applicationsRepository.findOneBy({
      userId,
      category: dto.category,
      status: ListingAccessStatus.Pending,
    });

    if (pending) {
      throw new BadRequestException('Application already pending');
    }

    const application = this.applicationsRepository.create({
      userId,
      category: dto.category,
      reason: dto.reason.trim(),
    });

    return {
      application: await this.applicationsRepository.save(application),
    };
  }

  async redeemAccessCode(userId: string, dto: RedeemAccessCodeDto) {
    await this.findActiveUser(userId);
    const accessCode = await this.accessCodesRepository.findOne({
      where: {
        code: dto.code.trim().toUpperCase(),
        isActive: true,
        usedAt: IsNull(),
      },
    });

    if (!accessCode || this.isExpired(accessCode.expiresAt)) {
      throw new BadRequestException('Invalid access code');
    }

    const existingPermission = await this.permissionsRepository.findOneBy({
      userId,
      category: accessCode.category,
    });

    if (existingPermission) {
      throw new BadRequestException('Listing access already granted');
    }

    const permission = await this.permissionsRepository.save(
      this.permissionsRepository.create({
        userId,
        category: accessCode.category,
        sourceCode: accessCode.code,
      }),
    );

    await this.accessCodesRepository.update(accessCode.id, {
      usedById: userId,
      usedAt: new Date(),
    });

    return { listingPermission: permission };
  }

  async listMyBids(userId: string, query: ListUserBidsQueryDto) {
    const bids = await this.bidsRepository.find({
      where: { bidderId: userId },
      order: { createdAt: 'DESC' },
    });

    const auctionIds = [...new Set(bids.map((b) => b.auctionId))];
    if (auctionIds.length === 0) {
      return { items: [], total: 0 };
    }

    const auctions = await this.auctionsRepository.find({
      where: { id: In(auctionIds) },
    });
    const auctionMap = new Map(auctions.map((a) => [a.id, a]));

    const listings = await this.loadListings(auctions);
    const listingMap = new Map(listings.map((l) => [l.id, l]));

    const items = bids
      .map((bid) => {
        const auction = auctionMap.get(bid.auctionId);
        if (!auction) return null;

        const listing = listingMap.get(auction.listingId);
        const derivedStatus = this.deriveUserBidStatus(bid, auction);
        if (
          query.status &&
          derivedStatus !== (query.status as unknown as string).toLowerCase()
        )
          return null;

        return {
          auctionId: auction.id,
          auctionTitle: listing
            ? this.buildListingTitle(auction.category, listing)
            : 'Untitled',
          category: auction.category,
          bidAmountKobo: bid.amountKobo,
          status: derivedStatus === 'won'
            ? 'won'
            : bid.status === BidStatus.Winning
              ? 'leading'
              : bid.status === BidStatus.Outbid
                ? 'outbid'
                : bid.status === BidStatus.Accepted
                  ? 'leading'
                  : 'outbid',
          currentHighBidKobo: auction.currentWinningBidId === bid.id
            ? bid.amountKobo
            : this.getTopBidAmount(bids, auction),
          endsAt: auction.endTime,
          photoUrl: listing?.photoUrls?.[0] ?? null,
        };
      })
      .filter(Boolean);

    const filtered = items as NonNullable<(typeof items)[0]>[];
    const total = filtered.length;
    const paged = filtered.slice(query.offset, query.offset + query.limit);

    return { items: paged, total };
  }

  async listWonAuctions(userId: string) {
    const auctions = await this.auctionsRepository.find({
      where: [
        { winnerId: userId, status: AuctionStatus.Settled },
        { winnerId: userId, status: AuctionStatus.AwaitingPayment },
      ],
      order: { updatedAt: 'DESC' },
    });

    if (auctions.length === 0) {
      return { items: [] };
    }

    const listings = await this.loadListings(auctions);
    const listingMap = new Map(listings.map((l) => [l.id, l]));

    const auctionIds = auctions.map((a) => a.id);
    const deliveries = await this.deliveryRepository.find({
      where: { auctionId: In(auctionIds) },
    });
    const deliveryMap = new Map(deliveries.map((d) => [d.auctionId, d]));

    const items = auctions.map((auction) => {
      const listing = listingMap.get(auction.listingId);
      const delivery = deliveryMap.get(auction.id);

      return {
        auctionId: auction.id,
        title: listing
          ? this.buildListingTitle(auction.category, listing)
          : 'Untitled',
        category: auction.category,
        wonAt: auction.settledAt ?? auction.updatedAt,
        paidAt: auction.settledAt,
        deliveryStatus: delivery?.status ?? 'payment_confirmed',
        trackingInfo: delivery?.trackingInfo ?? null,
      };
    });

    return { items };
  }

  async getStats(userId: string) {
    const bids = await this.bidsRepository.find({
      where: { bidderId: userId },
    });

    const totalBids = bids.length;
    const wonAuctions = await this.auctionsRepository.count({
      where: { winnerId: userId, status: AuctionStatus.Settled },
    });
    const winRate = totalBids > 0 ? Math.round((wonAuctions / totalBids) * 100) : 0;
    const totalSpentKobo = bids
      .filter((b) => b.status === BidStatus.Winning || b.status === BidStatus.Accepted)
      .reduce((sum, b) => sum + b.amountKobo, 0);

    return {
      totalBids,
      auctionsWon: wonAuctions,
      winRate,
      totalSpentKobo,
    };
  }

  async listApplications(userId: string) {
    const applications = await this.applicationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return {
      items: applications.map((app) => ({
        id: app.id,
        category: app.category,
        reason: app.reason,
        status: app.status,
        reviewNote: app.reviewNote,
        createdAt: app.createdAt,
        reviewedAt: app.reviewedAt,
      })),
    };
  }

  async addWatchlist(userId: string, auctionId: string) {
    const auction = await this.auctionsRepository.findOneBy({ id: auctionId });
    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    const existing = await this.watchlistRepository.findOneBy({
      userId,
      auctionId,
    });
    if (existing) {
      throw new BadRequestException('Auction already in watchlist');
    }

    const entry = this.watchlistRepository.create({ userId, auctionId });
    await this.watchlistRepository.save(entry);

    return { watchlist: { id: entry.id, auctionId, createdAt: entry.createdAt } };
  }

  async removeWatchlist(userId: string, auctionId: string) {
    const entry = await this.watchlistRepository.findOneBy({
      userId,
      auctionId,
    });
    if (!entry) {
      throw new NotFoundException('Watchlist entry not found');
    }

    await this.watchlistRepository.remove(entry);
    return { removed: true };
  }

  async listWatchlist(userId: string) {
    const entries = await this.watchlistRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (entries.length === 0) {
      return { items: [] };
    }

    const auctionIds = entries.map((e) => e.auctionId);
    const auctions = await this.auctionsRepository.find({
      where: { id: In(auctionIds) },
    });
    const auctionMap = new Map(auctions.map((a) => [a.id, a]));

    const listings = await this.loadListings(auctions);
    const listingMap = new Map(listings.map((l) => [l.id, l]));

    const items = entries.map((entry) => {
      const auction = auctionMap.get(entry.auctionId);
      const listing = auction ? listingMap.get(auction.listingId) : null;

      return {
        id: entry.id,
        auctionId: entry.auctionId,
        auctionTitle: listing
          ? this.buildListingTitle(auction!.category, listing)
          : 'Untitled',
        category: auction?.category ?? null,
        status: auction?.status ?? null,
        startTime: auction?.startTime ?? null,
        endTime: auction?.endTime ?? null,
        photoUrl: listing?.photoUrls?.[0] ?? null,
        createdAt: entry.createdAt,
      };
    });

    return { items };
  }

  private async findActiveUser(userId: string) {
    const user = await this.usersRepository.findOneBy({
      id: userId,
      isActive: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async ensurePreferences(userId: string) {
    const existing = await this.preferencesRepository.findOneBy({ userId });

    if (existing) {
      return existing;
    }

    return this.preferencesRepository.save(
      this.preferencesRepository.create({ userId }),
    );
  }

  private isExpired(expiresAt: Date | null) {
    return Boolean(expiresAt && expiresAt.getTime() <= Date.now());
  }

  private async loadListings(
    auctions: Auction[],
  ): Promise<(CarListing | GadgetListing & { id: string })[]> {
    const carAuctionIds = auctions
      .filter((a) => a.category === ListingCategory.Car)
      .map((a) => a.listingId);
    const gadgetAuctionIds = auctions
      .filter((a) => a.category === ListingCategory.Gadget)
      .map((a) => a.listingId);

    const [cars, gadgets] = await Promise.all([
      carAuctionIds.length > 0
        ? this.carListingsRepository.find({ where: { id: In(carAuctionIds) } })
        : [],
      gadgetAuctionIds.length > 0
        ? this.gadgetListingsRepository.find({
            where: { id: In(gadgetAuctionIds) },
          })
        : [],
    ]);

    return [...cars, ...gadgets] as (CarListing | GadgetListing & {
      id: string;
    })[];
  }

  private buildListingTitle(
    category: ListingCategory,
    listing: CarListing | GadgetListing,
  ): string {
    if (category === ListingCategory.Car) {
      const car = listing as CarListing;
      return `${car.make} ${car.model} ${car.year}`;
    }
    const gadget = listing as GadgetListing;
    return `${gadget.brand} ${gadget.model}`;
  }

  private deriveUserBidStatus(
    bid: Bid,
    auction: Auction,
  ): 'active' | 'scheduled' | 'won' {
    if (auction.status === AuctionStatus.Settled && auction.winnerId === bid.bidderId) {
      return 'won';
    }
    if (
      auction.status === AuctionStatus.AwaitingPayment &&
      auction.winnerId === bid.bidderId
    ) {
      return 'won';
    }
    if (
      [AuctionStatus.Scheduled, AuctionStatus.Live].includes(auction.status)
    ) {
      if (auction.status === AuctionStatus.Scheduled) return 'scheduled';
      return 'active';
    }
    return 'active';
  }

  private getTopBidAmount(bids: Bid[], auction: Auction): number {
    const auctionBids = bids.filter((b) => b.auctionId === auction.id);
    const sorted = [...auctionBids].sort((a, b) =>
      a.amountKobo !== b.amountKobo
        ? b.amountKobo - a.amountKobo
        : a.createdAt.getTime() - b.createdAt.getTime(),
    );
    return sorted[0]?.amountKobo ?? auction.basePriceKobo;
  }
}
