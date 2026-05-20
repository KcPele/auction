import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
}
