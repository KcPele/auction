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
import { UserRole } from '../../common/enums/user-role.enum';
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
import {
  buildListingTitle,
  deriveUserBidStatus,
  isExpired,
} from './users-display.utils';
import { queryUserBidCounts, queryUserBidPage } from './user-bids.query';
import { loadAuctionListings } from './users-listings.query';
import { presentWatchlistItems } from './users-watchlist.presenter';

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

  async getMe(userId: string, effectiveRole?: UserRole) {
    const user = await this.findActiveUser(userId);
    const preferences = await this.ensurePreferences(user.id);
    const permissions = await this.permissionsRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });

    // Prefer the effective role computed by AuthService (which folds in the
    // Better Auth admin flag). Falls back to the app users.role copy.
    if (effectiveRole && effectiveRole !== user.role) {
      user.role = effectiveRole;
    }

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
    const firstName = dto.firstName?.trim();
    const lastName = dto.lastName?.trim();

    if (dto.firstName !== undefined && !firstName) {
      throw new BadRequestException('First name is required');
    }
    if (dto.lastName !== undefined && !lastName) {
      throw new BadRequestException('Last name is required');
    }

    if (dto.phone && dto.phone !== user.phone) {
      const existing = await this.usersRepository.findOneBy({
        phone: dto.phone,
      });

      if (existing) {
        throw new BadRequestException('Phone already exists');
      }
    }

    Object.assign(user, {
      firstName: firstName ?? user.firstName,
      lastName: lastName ?? user.lastName,
      phone: dto.phone ?? user.phone,
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

    if (!accessCode || isExpired(accessCode.expiresAt)) {
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
    const [page, counts] = await Promise.all([
      queryUserBidPage(this.bidsRepository, userId, query),
      queryUserBidCounts(this.bidsRepository, userId),
    ]);
    const auctionIds = page.rows.map((row) => row.auctionId);
    if (page.total === 0 || auctionIds.length === 0) {
      return { items: [], total: 0, counts };
    }

    const auctions = await this.auctionsRepository.find({
      where: { id: In(auctionIds) },
    });
    const auctionMap = new Map(auctions.map((a) => [a.id, a]));

    const topBidIds = auctions
      .map((auction) => auction.currentWinningBidId)
      .filter((id): id is string => Boolean(id));
    const topBids = topBidIds.length
      ? await this.bidsRepository.find({ where: { id: In(topBidIds) } })
      : [];
    const topBidMap = new Map(topBids.map((bid) => [bid.id, bid]));

    const listings = await this.loadListings(auctions);
    const listingMap = new Map(listings.map((l) => [l.id, l]));

    const items = page.rows
      .map((row) => {
        const auction = auctionMap.get(row.auctionId);
        if (!auction) return null;

        const listing = listingMap.get(auction.listingId);
        const derivedStatus = deriveUserBidStatus(
          { bidderId: userId } as Bid,
          auction,
        );
        const winningBid = auction.currentWinningBidId
          ? topBidMap.get(auction.currentWinningBidId)
          : null;
        const isUserLeading = winningBid?.bidderId === userId;

        return {
          auctionId: auction.id,
          auctionTitle: listing
            ? buildListingTitle(auction.category, listing)
            : 'Untitled',
          category: auction.category,
          bidAmountKobo: row.bidAmountKobo,
          status: derivedStatus === 'won'
            ? 'won'
            : isUserLeading
              ? 'leading'
              : 'outbid',
          currentHighBidKobo: auction.currentWinningBidId
            ? (winningBid?.amountKobo ?? auction.basePriceKobo)
            : auction.basePriceKobo,
          endsAt: auction.endTime,
          photoUrl: listing?.photoUrls?.[0] ?? null,
        };
      })
      .filter(Boolean);

    return {
      items: items.filter(Boolean) as NonNullable<(typeof items)[0]>[],
      total: page.total,
      counts,
    };
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
          ? buildListingTitle(auction.category, listing)
          : 'Untitled',
        category: auction.category,
        wonAt: auction.settledAt ?? auction.updatedAt,
        paidAt: auction.settledAt,
        deliveryStatus:
          delivery?.status ??
          (auction.status === AuctionStatus.AwaitingPayment
            ? 'payment_pending'
            : 'payment_confirmed'),
        trackingInfo: delivery?.trackingInfo ?? null,
      };
    });

    return { items };
  }

  async listDeliveries(userId: string) {
    const deliveries = await this.deliveryRepository.find({
      where: [{ winnerId: userId }, { sellerId: userId }],
      order: { updatedAt: 'DESC' },
    });
    if (deliveries.length === 0) return { items: [] };

    const auctions = await this.auctionsRepository.find({
      where: { id: In(deliveries.map((delivery) => delivery.auctionId)) },
    });
    const auctionMap = new Map(auctions.map((auction) => [auction.id, auction]));
    const listings = await this.loadListings(auctions);
    const listingMap = new Map(listings.map((listing) => [listing.id, listing]));

    return {
      items: deliveries.flatMap((delivery) => {
        const auction = auctionMap.get(delivery.auctionId);
        if (!auction) return [];
        const listing = listingMap.get(auction.listingId);
        return [{
          auctionId: auction.id,
          title: listing
            ? buildListingTitle(auction.category, listing)
            : 'Untitled',
          category: auction.category,
          role: delivery.sellerId === userId ? 'SELLER' : 'BUYER',
          status: delivery.status,
          trackingInfo: delivery.trackingInfo,
          updatedAt: delivery.updatedAt,
        }];
      }),
    };
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
    const listings = await this.loadListings(auctions);

    return { items: presentWatchlistItems({ entries, auctions, listings }) };
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

  private async loadListings(
    auctions: Auction[],
  ): Promise<(CarListing | GadgetListing)[]> {
    return loadAuctionListings({
      auctions,
      carListingsRepository: this.carListingsRepository,
      gadgetListingsRepository: this.gadgetListingsRepository,
    });
  }

}
