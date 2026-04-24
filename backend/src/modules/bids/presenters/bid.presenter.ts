import type { Bid } from '../entities/bid.entity';

export function presentBid(bid: Bid) {
  return {
    id: bid.id,
    auctionId: bid.auctionId,
    bidderId: bid.bidderId,
    amountKobo: bid.amountKobo,
    walletHoldId: bid.walletHoldId,
    status: bid.status,
    createdAt: bid.createdAt,
  };
}
