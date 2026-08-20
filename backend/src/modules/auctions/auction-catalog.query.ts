import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BidStatus } from '../../common/enums/bid-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { Bid } from '../bids/entities/bid.entity';
import { CarListing } from '../cars/entities/car-listing.entity';
import { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
import { User } from '../users/entities/user.entity';
import { ListAuctionsQueryDto } from './dto/list-auctions-query.dto';
import { Auction } from './entities/auction.entity';
import { presentAuction } from './presenters/auction.presenter';

@Injectable()
export class AuctionCatalogQuery {
  constructor(
    @InjectRepository(Auction)
    private readonly auctions: Repository<Auction>,
    @InjectRepository(Bid) private readonly bids: Repository<Bid>,
    @InjectRepository(CarListing)
    private readonly cars: Repository<CarListing>,
    @InjectRepository(GadgetListing)
    private readonly gadgets: Repository<GadgetListing>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async list(query: ListAuctionsQueryDto) {
    let auctionIds = query.search
      ? await this.searchAuctionIds(query.search)
      : null;
    if (auctionIds?.length === 0) return { auctions: [], total: 0 };

    if (
      (query.minYear || query.maxYear) &&
      query.category !== ListingCategory.Gadget
    ) {
      const yearQb = this.cars.createQueryBuilder('c').select('c.id');
      if (query.minYear)
        yearQb.andWhere('c.year >= :minY', { minY: query.minYear });
      if (query.maxYear)
        yearQb.andWhere('c.year <= :maxY', { maxY: query.maxYear });
      const carIds = (await yearQb.getMany()).map((car) => car.id);
      if (carIds.length === 0) return { auctions: [], total: 0 };
      const yearAuctions = await this.auctions.find({
        where: { category: ListingCategory.Car, listingId: In(carIds) },
        select: ['id'],
      });
      const yearIds = yearAuctions.map((auction) => auction.id);
      auctionIds = auctionIds
        ? auctionIds.filter((id) => yearIds.includes(id))
        : yearIds;
      if (auctionIds.length === 0) return { auctions: [], total: 0 };
    }

    const qb = this.auctions
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
    const [auctions, total] = await qb.getManyAndCount();
    const [bidStats, carMap, gadgetMap] = await Promise.all([
      this.getBidStats(auctions),
      this.getCarMap(auctions),
      this.getGadgetMap(auctions),
    ]);
    const bidStatsMap = new Map(bidStats.map((stats) => [stats.auctionId, stats]));

    return {
      total,
      auctions: auctions.map((auction) =>
        this.presentCatalogAuction(
          auction,
          bidStatsMap.get(auction.id),
          carMap,
          gadgetMap,
        ),
      ),
    };
  }

  async findOne(id: string) {
    const auction = await this.findAuction(id);
    const listing =
      auction.category === ListingCategory.Car
        ? await this.cars.findOneBy({ id: auction.listingId })
        : await this.gadgets.findOneBy({ id: auction.listingId });
    return {
      auction: presentAuction(auction),
      listing: listing ? presentListing(auction.category, listing) : null,
    };
  }

  async listBids(auctionId: string) {
    await this.findAuction(auctionId);
    const bids = await this.bids.find({
      where: { auctionId },
      order: { amountKobo: 'DESC', createdAt: 'ASC' },
    });
    if (bids.length === 0) return { bids: [] };
    const users = await this.users.find({
      where: { id: In([...new Set(bids.map((bid) => bid.bidderId))]) },
      select: ['id', 'firstName', 'lastName'],
    });
    const userMap = new Map(users.map((user) => [user.id, user]));
    return {
      bids: bids.map((bid) => ({
        id: bid.id,
        userId: bid.bidderId,
        handle: userMap.has(bid.bidderId)
          ? `@${userMap.get(bid.bidderId)!.firstName.toLowerCase()}***`
          : '@unknown',
        amountKobo: bid.amountKobo,
        placedAt: bid.createdAt,
        isLeading: bid.status === BidStatus.Winning,
        status: bid.status,
      })),
    };
  }

  private async getBidStats(auctions: Auction[]) {
    if (auctions.length === 0) return [];
    return this.bids
      .createQueryBuilder('bid')
      .select('bid.auctionId', 'auctionId')
      .addSelect('COUNT(DISTINCT bid.bidderId)', 'bidderCount')
      .addSelect('MAX(bid.amountKobo)', 'currentBidKobo')
      .where('bid.auctionId IN (:...auctionIds)', {
        auctionIds: auctions.map((auction) => auction.id),
      })
      .groupBy('bid.auctionId')
      .getRawMany<{
        auctionId: string;
        bidderCount: string;
        currentBidKobo: string;
      }>();
  }

  private async getCarMap(auctions: Auction[]) {
    const ids = auctions
      .filter((auction) => auction.category === ListingCategory.Car)
      .map((auction) => auction.listingId);
    const cars = ids.length ? await this.cars.find({ where: { id: In(ids) } }) : [];
    return new Map(cars.map((car) => [car.id, car]));
  }

  private async getGadgetMap(auctions: Auction[]) {
    const ids = auctions
      .filter((auction) => auction.category === ListingCategory.Gadget)
      .map((auction) => auction.listingId);
    const gadgets = ids.length
      ? await this.gadgets.find({ where: { id: In(ids) } })
      : [];
    return new Map(gadgets.map((gadget) => [gadget.id, gadget]));
  }

  private presentCatalogAuction(
    auction: Auction,
    stats: { bidderCount: string; currentBidKobo: string } | undefined,
    cars: Map<string, CarListing>,
    gadgets: Map<string, GadgetListing>,
  ) {
    const base = {
      ...presentAuction(auction),
      bidderCount: Number(stats?.bidderCount ?? 0),
      currentBidKobo: Number(stats?.currentBidKobo ?? auction.basePriceKobo),
    };
    if (auction.category === ListingCategory.Car) {
      const car = cars.get(auction.listingId);
      return car
        ? {
            ...base,
            title: `${car.year} ${car.make} ${car.model}`.trim(),
            subtitle: [car.condition, `${car.mileage.toLocaleString()} km`]
              .filter(Boolean)
              .join(' · '),
            coverUrl: car.photoUrls?.[0] ?? null,
          }
        : base;
    }
    const gadget = gadgets.get(auction.listingId);
    return gadget
      ? {
          ...base,
          title: `${gadget.brand} ${gadget.model}`.trim(),
          subtitle: [
            gadget.type,
            gadget.batteryHealthPercent
              ? `${gadget.batteryHealthPercent}% battery`
              : null,
          ]
            .filter(Boolean)
            .join(' · '),
          coverUrl: gadget.photoUrls?.[0] ?? null,
        }
      : base;
  }

  private async searchAuctionIds(keyword: string) {
    const term = `%${keyword}%`;
    const [cars, gadgets] = await Promise.all([
      this.cars
        .createQueryBuilder('car')
        .select('car.id', 'listingId')
        .where(
          'car.make ILIKE :term OR car.model ILIKE :term OR car.colour ILIKE :term OR CAST(car.year AS TEXT) ILIKE :term',
          { term },
        )
        .getRawMany<{ listingId: string }>(),
      this.gadgets
        .createQueryBuilder('gadget')
        .select('gadget.id', 'listingId')
        .where(
          'gadget.brand ILIKE :term OR gadget.model ILIKE :term OR gadget.type ILIKE :term OR gadget.colour ILIKE :term',
          { term },
        )
        .getRawMany<{ listingId: string }>(),
    ]);
    const listingIds = [...cars, ...gadgets].map((row) => row.listingId);
    if (listingIds.length === 0) return [];
    return (
      await this.auctions.find({
        where: { listingId: In(listingIds) },
        select: ['id'],
      })
    ).map((auction) => auction.id);
  }

  private async findAuction(id: string) {
    const auction = await this.auctions.findOneBy({ id });
    if (!auction) throw new NotFoundException('Auction not found');
    return auction;
  }
}

function presentListing(
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
