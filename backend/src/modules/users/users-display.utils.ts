import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import type { Auction } from '../auctions/entities/auction.entity';
import type { Bid } from '../bids/entities/bid.entity';
import type { CarListing } from '../cars/entities/car-listing.entity';
import type { GadgetListing } from '../gadgets/entities/gadget-listing.entity';

export function isExpired(expiresAt: Date | null) {
  return Boolean(expiresAt && expiresAt.getTime() <= Date.now());
}

export function buildListingTitle(
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

export function deriveUserBidStatus(
  bid: Bid,
  auction: Auction,
): 'active' | 'scheduled' | 'won' {
  if (
    [AuctionStatus.Settled, AuctionStatus.AwaitingPayment].includes(
      auction.status,
    ) && auction.winnerId === bid.bidderId
  ) {
    return 'won';
  }
  return auction.status === AuctionStatus.Scheduled ? 'scheduled' : 'active';
}
