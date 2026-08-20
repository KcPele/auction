import type { Auction } from '../auctions/entities/auction.entity';
import type { CarListing } from '../cars/entities/car-listing.entity';
import type { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
import type { Watchlist } from './entities/watchlist.entity';
import { buildListingTitle } from './users-display.utils';

export function presentWatchlistItems(input: {
  entries: Watchlist[];
  auctions: Auction[];
  listings: (CarListing | GadgetListing)[];
}) {
  const auctionMap = new Map(input.auctions.map((auction) => [auction.id, auction]));
  const listingMap = new Map(input.listings.map((listing) => [listing.id, listing]));

  return input.entries.map((entry) => {
    const auction = auctionMap.get(entry.auctionId);
    const listing = auction ? listingMap.get(auction.listingId) : null;

    return {
      id: entry.id,
      auctionId: entry.auctionId,
      auctionTitle: listing
        ? buildListingTitle(auction!.category, listing)
        : 'Untitled',
      category: auction?.category ?? null,
      status: auction?.status ?? null,
      startTime: auction?.startTime ?? null,
      endTime: auction?.endTime ?? null,
      photoUrl: listing?.photoUrls?.[0] ?? null,
      createdAt: entry.createdAt,
    };
  });
}
