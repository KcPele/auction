import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { Auction } from '../auctions/entities/auction.entity';
import { Bid } from '../bids/entities/bid.entity';
import { CarListing } from '../cars/entities/car-listing.entity';
import { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(Bid) private readonly bidsRepository: Repository<Bid>,
    @InjectRepository(Auction)
    private readonly auctionsRepository: Repository<Auction>,
    @InjectRepository(CarListing)
    private readonly carListingsRepository: Repository<CarListing>,
    @InjectRepository(GadgetListing)
    private readonly gadgetListingsRepository: Repository<GadgetListing>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async listRecentBids(limit: number) {
    const bids = await this.bidsRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });

    if (bids.length === 0) {
      return { items: [] };
    }

    const auctionIds = [...new Set(bids.map((b) => b.auctionId))];
    const userIds = [...new Set(bids.map((b) => b.bidderId))];

    const [auctions, users] = await Promise.all([
      this.auctionsRepository.find({ where: { id: In(auctionIds) } }),
      this.usersRepository.find({
        where: { id: In(userIds) },
        select: ['id', 'firstName', 'lastName'],
      }),
    ]);
    const auctionMap = new Map(auctions.map((a) => [a.id, a]));
    const userMap = new Map(users.map((u) => [u.id, u]));

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

    const items = bids.map((b) => {
      const auction = auctionMap.get(b.auctionId);
      const user = userMap.get(b.bidderId);
      const handle = user
        ? `${user.firstName.toLowerCase()}.${user.lastName.charAt(0).toLowerCase()}`
        : 'someone';

      let item = 'Auction';
      if (auction) {
        if (auction.category === ListingCategory.Car) {
          const c = carMap.get(auction.listingId);
          if (c) item = `${c.year} ${c.make} ${c.model}`.trim();
        } else {
          const g = gadgetMap.get(auction.listingId);
          if (g) item = `${g.brand} ${g.model}`.trim();
        }
      }

      return {
        item,
        bidKobo: b.amountKobo,
        user: handle,
        // City is not stored on the user yet — return null so the UI can hide
        // or fall back. Add when user profile gets a `city` column.
        city: null as string | null,
        placedAt: b.createdAt,
      };
    });

    return { items };
  }

  /**
   * Marketing stats for the landing page hero. Cheap aggregate queries; if
   * we ever need sub-second freshness we can move them behind a 60s cache.
   */
  async getStats() {
    const [settledAuctions, totalBidders, settledIn24h, settledTotal] =
      await Promise.all([
        this.auctionsRepository.find({
          where: { status: AuctionStatus.Settled },
          select: ['id', 'externalPaymentKobo', 'walletPaymentKobo', 'settledAt'],
        }),
        this.usersRepository.count(),
        this.auctionsRepository
          .createQueryBuilder('a')
          .where('a.status = :status', { status: AuctionStatus.Settled })
          .andWhere(
            'a."settledAt" >= NOW() - INTERVAL \'24 hours\' AND a."endTime" >= NOW() - INTERVAL \'24 hours\'',
          )
          .getCount(),
        this.auctionsRepository.count({
          where: { status: In([AuctionStatus.Settled, AuctionStatus.Defaulted]) },
        }),
      ]);

    const tradedKobo = settledAuctions.reduce(
      (sum, a) =>
        sum +
        Number(a.externalPaymentKobo ?? 0) +
        Number(a.walletPaymentKobo ?? 0),
      0,
    );
    const settlementRate =
      settledTotal > 0
        ? Math.round((settledAuctions.length / settledTotal) * 1000) / 10
        : 100;

    return {
      tradedVolumeKobo: tradedKobo,
      verifiedBidders: totalBidders,
      settlementRate, // percent, one decimal
      settledIn24h,
    };
  }

  /**
   * Per-category aggregate counts + price range for the landing Categories
   * cards. Each card needs: live count, settled count, min/max base price of
   * currently live/scheduled auctions in that category.
   */
  async getCategoryStats() {
    const buckets: Array<{ category: ListingCategory; key: 'cars' | 'gadgets' }> = [
      { category: ListingCategory.Car, key: 'cars' },
      { category: ListingCategory.Gadget, key: 'gadgets' },
    ];

    const stats = await Promise.all(
      buckets.map(async ({ category, key }) => {
        const [liveCount, settledCount, openAuctions] = await Promise.all([
          this.auctionsRepository.count({
            where: { category, status: AuctionStatus.Live },
          }),
          this.auctionsRepository.count({
            where: { category, status: AuctionStatus.Settled },
          }),
          this.auctionsRepository.find({
            where: {
              category,
              status: In([AuctionStatus.Scheduled, AuctionStatus.Live]),
            },
            select: ['basePriceKobo'],
          }),
        ]);

        const prices = openAuctions
          .map((a) => Number(a.basePriceKobo))
          .filter((n) => Number.isFinite(n) && n > 0);
        const minKobo = prices.length ? Math.min(...prices) : 0;
        const maxKobo = prices.length ? Math.max(...prices) : 0;

        return {
          key,
          liveCount,
          settledCount,
          priceRange: { minKobo, maxKobo },
        };
      }),
    );

    return { categories: stats };
  }

  /**
   * Cross-resource search powering the dashboard TopBar. Matches car
   * make/model/year and gadget brand/model against the query, returning at
   * most `limit` auctions with their listing title. Public so the same
   * implementation works for guests and signed-in users alike.
   */
  async search(query: string, limit = 8) {
    const q = query.trim();
    if (q.length < 2) {
      return { items: [] };
    }
    const like = `%${q.toLowerCase()}%`;
    const numericYear = /^\d{4}$/.test(q) ? Number(q) : null;

    const carWhere = numericYear
      ? '(LOWER(c.make) LIKE :like OR LOWER(c.model) LIKE :like OR c.year = :year)'
      : '(LOWER(c.make) LIKE :like OR LOWER(c.model) LIKE :like)';
    const cars = await this.carListingsRepository
      .createQueryBuilder('c')
      .where(carWhere, { like, year: numericYear })
      .limit(limit)
      .getMany();

    const gadgets = await this.gadgetListingsRepository
      .createQueryBuilder('g')
      .where('LOWER(g.brand) LIKE :like OR LOWER(g.model) LIKE :like', { like })
      .limit(limit)
      .getMany();

    const carIds = cars.map((c) => c.id);
    const gadgetIds = gadgets.map((g) => g.id);
    const ids = [...carIds, ...gadgetIds];
    if (ids.length === 0) return { items: [] };

    const auctions = await this.auctionsRepository.find({
      where: [
        ...(carIds.length
          ? [{ category: ListingCategory.Car, listingId: In(carIds) }]
          : []),
        ...(gadgetIds.length
          ? [{ category: ListingCategory.Gadget, listingId: In(gadgetIds) }]
          : []),
      ],
      take: limit,
    });

    const carMap = new Map(cars.map((c) => [c.id, c]));
    const gadgetMap = new Map(gadgets.map((g) => [g.id, g]));

    const items = auctions.map((a) => {
      if (a.category === ListingCategory.Car) {
        const c = carMap.get(a.listingId)!;
        return {
          type: 'auction' as const,
          auctionId: a.id,
          status: a.status,
          category: 'CAR' as const,
          title: `${c.year} ${c.make} ${c.model}`.trim(),
          subtitle: c.condition,
          coverUrl: c.photoUrls?.[0] ?? null,
        };
      }
      const g = gadgetMap.get(a.listingId)!;
      return {
        type: 'auction' as const,
        auctionId: a.id,
        status: a.status,
        category: 'GADGET' as const,
        title: `${g.brand} ${g.model}`.trim(),
        subtitle: g.type,
        coverUrl: g.photoUrls?.[0] ?? null,
      };
    });

    return { items };
  }

  /**
   * Returns the most prominent live auction for the landing hero card.
   * Falls back to the next scheduled one so the card never goes empty.
   */
  async getFeaturedAuction() {
    const live = await this.auctionsRepository.findOne({
      where: { status: AuctionStatus.Live },
      order: { startTime: 'ASC' },
    });
    const auction =
      live ??
      (await this.auctionsRepository.findOne({
        where: { status: AuctionStatus.Scheduled },
        order: { startTime: 'ASC' },
      }));

    if (!auction) return null;

    let title = 'Featured auction';
    let subtitle: string | null = null;
    if (auction.category === ListingCategory.Car) {
      const car = await this.carListingsRepository.findOneBy({
        id: auction.listingId,
      });
      if (car) {
        title = `${car.year} ${car.make} ${car.model}`.trim();
        subtitle = [
          car.condition,
          car.mileage ? `${car.mileage.toLocaleString()} km` : null,
        ]
          .filter(Boolean)
          .join(' · ');
      }
    } else {
      const gadget = await this.gadgetListingsRepository.findOneBy({
        id: auction.listingId,
      });
      if (gadget) {
        title = `${gadget.brand} ${gadget.model}`.trim();
        subtitle = [
          gadget.type,
          gadget.batteryHealthPercent
            ? `${gadget.batteryHealthPercent}% battery`
            : null,
        ]
          .filter(Boolean)
          .join(' · ');
      }
    }

    const topBid = await this.bidsRepository.findOne({
      where: { auctionId: auction.id },
      order: { amountKobo: 'DESC' },
    });
    const basePriceKobo = Number(auction.basePriceKobo);
    const bidderCount = await this.bidsRepository
      .createQueryBuilder('b')
      .select('COUNT(DISTINCT b."bidderId")', 'count')
      .where('b."auctionId" = :id', { id: auction.id })
      .getRawOne<{ count: string }>();

    return {
      id: auction.id,
      category: auction.category,
      title,
      subtitle,
      basePriceKobo,
      currentBidKobo: topBid ? Number(topBid.amountKobo) : basePriceKobo,
      bidders: Number(bidderCount?.count ?? 0),
      holdPercent: auction.holdPercent,
      startTime: auction.startTime,
      endTime: auction.endTime,
      status: auction.status,
    };
  }
}
