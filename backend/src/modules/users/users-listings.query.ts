import type { Repository } from 'typeorm';
import { In } from 'typeorm';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import type { Auction } from '../auctions/entities/auction.entity';
import type { CarListing } from '../cars/entities/car-listing.entity';
import type { GadgetListing } from '../gadgets/entities/gadget-listing.entity';

export async function loadAuctionListings(input: {
  auctions: Auction[];
  carListingsRepository: Repository<CarListing>;
  gadgetListingsRepository: Repository<GadgetListing>;
}): Promise<(CarListing | GadgetListing)[]> {
  const carListingIds = input.auctions
    .filter((auction) => auction.category === ListingCategory.Car)
    .map((auction) => auction.listingId);
  const gadgetListingIds = input.auctions
    .filter((auction) => auction.category === ListingCategory.Gadget)
    .map((auction) => auction.listingId);

  const [cars, gadgets] = await Promise.all([
    carListingIds.length
      ? input.carListingsRepository.find({ where: { id: In(carListingIds) } })
      : [],
    gadgetListingIds.length
      ? input.gadgetListingsRepository.find({
          where: { id: In(gadgetListingIds) },
        })
      : [],
  ]);

  return [...cars, ...gadgets];
}
