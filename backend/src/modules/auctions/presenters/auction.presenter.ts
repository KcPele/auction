import type { Auction } from '../entities/auction.entity';

export function presentAuction(auction: Auction) {
  return {
    id: auction.id,
    category: auction.category,
    listingId: auction.listingId,
    sellerId: auction.sellerId,
    basePriceKobo: auction.basePriceKobo,
    minimumBidIncrementKobo: auction.minimumBidIncrementKobo,
    holdPercent: auction.holdPercent,
    sellerFeeBps: auction.sellerFeeBps,
    buyerFeeBps: auction.buyerFeeBps,
    startTime: auction.startTime,
    durationMinutes: auction.durationMinutes,
    endTime: auction.endTime,
    status: auction.status,
    currentWinningBidId: auction.currentWinningBidId,
    winnerId: auction.winnerId,
    paymentDeadlineAt: auction.paymentDeadlineAt,
    cancelledById: auction.cancelledById,
    cancellationReason: auction.cancellationReason,
    cancelledAt: auction.cancelledAt,
    createdAt: auction.createdAt,
    updatedAt: auction.updatedAt,
  };
}
