import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { Auction } from '../auctions/entities/auction.entity';
import { Bid } from '../bids/entities/bid.entity';
import { CarListing } from '../cars/entities/car-listing.entity';
import { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationRead } from '../notifications/entities/notification-read.entity';
import { Wallet } from '../wallets/entities/wallet.entity';

export type ToolResult = Record<string, unknown> | { error: string };

/**
 * Implements the read-only tools exposed to the support assistant. Each
 * function takes the signed-in `userId` as the first argument so the AI can
 * never look up another user's data — the scope is enforced server-side, not
 * by what the model decides to pass.
 */
@Injectable()
export class SupportAiTools {
  constructor(
    @InjectRepository(Wallet) private readonly walletsRepo: Repository<Wallet>,
    @InjectRepository(Bid) private readonly bidsRepo: Repository<Bid>,
    @InjectRepository(Auction)
    private readonly auctionsRepo: Repository<Auction>,
    @InjectRepository(CarListing)
    private readonly carsRepo: Repository<CarListing>,
    @InjectRepository(GadgetListing)
    private readonly gadgetsRepo: Repository<GadgetListing>,
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
    @InjectRepository(NotificationRead)
    private readonly notificationReadsRepo: Repository<NotificationRead>,
  ) {}

  async run(name: string, args: Record<string, unknown>, userId: string): Promise<ToolResult> {
    switch (name) {
      case 'get_my_wallet':
        return this.getMyWallet(userId);
      case 'get_my_bids':
        return this.getMyBids(userId, Number(args.limit ?? 5));
      case 'get_auction':
        return this.getAuction(String(args.auctionId ?? ''));
      case 'get_my_listings':
        return this.getMyListings(userId);
      case 'get_my_notifications':
        return this.getMyNotifications(userId, Number(args.limit ?? 5));
      case 'request_human_handoff':
        // Marker tool — orchestrator interprets this and flips state. Result
        // tells the model the handoff was accepted so its final message can
        // say so to the user.
        return {
          handoffRequested: true,
          reason: String(args.reason ?? 'User requested human assistance'),
        };
      default:
        return { error: `Unknown tool: ${name}` };
    }
  }

  // --- Implementations ---------------------------------------------------

  private async getMyWallet(userId: string): Promise<ToolResult> {
    const wallet = await this.walletsRepo.findOneBy({ userId });
    if (!wallet) return { error: 'No wallet yet' };
    return {
      currency: wallet.currency,
      balanceKobo: Number(wallet.balanceKobo),
      heldKobo: Number(wallet.heldKobo),
      availableKobo:
        Number(wallet.balanceKobo) - Number(wallet.heldKobo),
      updatedAt: wallet.updatedAt,
    };
  }

  private async getMyBids(userId: string, limit: number): Promise<ToolResult> {
    const safeLimit = Math.min(Math.max(limit, 1), 20);
    const bids = await this.bidsRepo.find({
      where: { bidderId: userId },
      order: { createdAt: 'DESC' },
      take: safeLimit,
    });
    return {
      bids: bids.map((b) => ({
        id: b.id,
        auctionId: b.auctionId,
        amountKobo: Number(b.amountKobo),
        status: b.status,
        placedAt: b.createdAt,
      })),
    };
  }

  private async getAuction(auctionId: string): Promise<ToolResult> {
    if (!auctionId) return { error: 'auctionId is required' };
    const auction = await this.auctionsRepo.findOneBy({ id: auctionId });
    if (!auction) return { error: 'Auction not found' };
    const topBid = await this.bidsRepo.findOne({
      where: { auctionId: auction.id },
      order: { amountKobo: 'DESC' },
    });
    return {
      id: auction.id,
      category: auction.category,
      status: auction.status,
      basePriceKobo: Number(auction.basePriceKobo),
      topBidKobo: topBid ? Number(topBid.amountKobo) : null,
      holdPercent: auction.holdPercent,
      startTime: auction.startTime,
      endTime: auction.endTime,
      winnerId: auction.winnerId,
      paymentDeadlineAt: auction.paymentDeadlineAt,
    };
  }

  private async getMyListings(userId: string): Promise<ToolResult> {
    const [cars, gadgets] = await Promise.all([
      this.carsRepo.find({ where: { listerId: userId }, order: { createdAt: 'DESC' } }),
      this.gadgetsRepo.find({ where: { listerId: userId }, order: { createdAt: 'DESC' } }),
    ]);
    return {
      cars: cars.map((c) => ({
        id: c.id,
        title: `${c.year} ${c.make} ${c.model}`.trim(),
        status: c.status,
        basePriceKobo: Number(c.basePriceKobo),
      })),
      gadgets: gadgets.map((g) => ({
        id: g.id,
        title: `${g.brand} ${g.model}`.trim(),
        status: g.status,
        basePriceKobo: Number(g.basePriceKobo),
      })),
    };
  }

  private async getMyNotifications(
    userId: string,
    limit: number,
  ): Promise<ToolResult> {
    const safeLimit = Math.min(Math.max(limit, 1), 20);
    const notifications = await this.notificationsRepo.find({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
      take: safeLimit,
    });
    const ids = notifications.map((n) => n.id);
    const reads = ids.length
      ? await this.notificationReadsRepo.find({
          where: { userId, notificationId: In(ids) },
        })
      : [];
    const readMap = new Map(reads.map((r) => [r.notificationId, r.readAt]));
    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        createdAt: n.createdAt,
        readAt: readMap.get(n.id) ?? null,
      })),
    };
  }

  // Helper used by the service to know which categories to query for a given
  // listing id, when the model passes one through `get_auction` callbacks.
  // (kept here so we don't expose ListingCategory elsewhere)
  static categories = [ListingCategory.Car, ListingCategory.Gadget];
}
