import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { BidStatus } from '../../common/enums/bid-status.enum';
import { WalletLedgerType } from '../../common/enums/wallet-ledger-type.enum';
import { Auction } from '../auctions/entities/auction.entity';
import { Bid } from '../bids/entities/bid.entity';
import { CarListing } from '../cars/entities/car-listing.entity';
import { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { WalletLedgerEntry } from '../wallets/entities/wallet-ledger-entry.entity';
import { ListAdminAuctionsQueryDto } from './dto/list-admin-auctions-query.dto';
import { ListAdminLedgerQueryDto } from './dto/list-admin-ledger-query.dto';
import { ListNotificationLogsQueryDto } from './dto/list-notification-logs-query.dto';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { NotificationDeliveryLog } from './entities/notification-delivery-log.entity';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(Auction) private readonly auctionsRepository: Repository<Auction>,
    @InjectRepository(Bid) private readonly bidsRepository: Repository<Bid>,
    @InjectRepository(CarListing) private readonly carListingsRepository: Repository<CarListing>,
    @InjectRepository(GadgetListing) private readonly gadgetListingsRepository: Repository<GadgetListing>,
    @InjectRepository(WalletLedgerEntry) private readonly ledgerRepository: Repository<WalletLedgerEntry>,
    @InjectRepository(Notification) private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(NotificationDeliveryLog) private readonly deliveryLogsRepository: Repository<NotificationDeliveryLog>,
    private readonly config: ConfigService,
  ) {}

  async getDashboardStats(range: string) {
    const since = this.parseRange(range);
    const [settledAuctions, activeHolds, activeBids] = await Promise.all([
      this.auctionsRepository.find({ where: { status: AuctionStatus.Settled, settledAt: since as Date | undefined } as Record<string, unknown> }),
      this.ledgerRepository.find({ where: { type: WalletLedgerType.BidHoldCreated } }),
      this.bidsRepository.count({ where: { status: In([BidStatus.Accepted, BidStatus.Winning]) } }),
    ]);

    const gmvKobo = settledAuctions.reduce((sum, a) => sum + (a.externalPaymentKobo ?? 0) + (a.walletPaymentKobo ?? 0), 0);
    const walletHoldsKobo = activeHolds.reduce((sum, e) => sum + Math.abs(e.amountKobo), 0);

    const totalPayments = await this.ledgerRepository.count({ where: { type: In([WalletLedgerType.FinalPaymentConfirmed, WalletLedgerType.BidHoldApplied]) } });
    const failedPayments = await this.ledgerRepository.count({ where: { type: WalletLedgerType.BidHoldForfeited } });
    const paymentSuccessRate = totalPayments + failedPayments > 0 ? Math.round((totalPayments / (totalPayments + failedPayments)) * 100) : 100;

    return { gmvKobo, auctionsSettled: settledAuctions.length, walletHoldsKobo, activeBids, paymentSuccessRate };
  }

  async getActivityFeed(limit: number, offset: number, type?: string) {
    const items: { id: string; type: string; handle: string; label: string; amountKobo?: number; ts: Date }[] = [];

    const [recentBids, recentNotifications] = await Promise.all([
      this.bidsRepository.find({ order: { createdAt: 'DESC' }, take: limit, skip: offset }),
      this.notificationsRepository.find({ where: { audience: 'USER' as never }, order: { createdAt: 'DESC' }, take: limit, skip: offset }),
    ]);

    const bidderIds = [...new Set(recentBids.map((b) => b.bidderId))];
    const users = bidderIds.length > 0 ? await this.usersRepository.find({ where: { id: In(bidderIds) }, select: ['id', 'firstName', 'lastName'] }) : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    if (!type || type === 'bid') {
      for (const bid of recentBids) {
        const user = userMap.get(bid.bidderId);
        items.push({ id: bid.id, type: 'bid', handle: user ? `@${user.firstName.toLowerCase()}***` : '@unknown', label: 'Placed a bid', amountKobo: bid.amountKobo, ts: bid.createdAt });
      }
    }

    if (!type || type === 'win' || type === 'pay' || type === 'alert') {
      for (const notif of recentNotifications) {
        const notifType = this.mapNotifType(notif.type);
        if (type && notifType !== type) continue;
        const user = notif.recipientId ? userMap.get(notif.recipientId) ?? null : null;
        items.push({ id: notif.id, type: notifType, handle: user ? `@${user.firstName.toLowerCase()}***` : 'system', label: notif.title, amountKobo: (notif.data?.amountKobo as number) ?? undefined, ts: notif.createdAt });
      }
    }

    items.sort((a, b) => b.ts.getTime() - a.ts.getTime());
    return { items: items.slice(0, limit) };
  }

  async listAdminAuctions(query: ListAdminAuctionsQueryDto) {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    const auctions = await this.auctionsRepository.find({ where, order: { startTime: 'DESC' }, take: query.limit, skip: query.offset });
    if (auctions.length === 0) return { items: [], total: 0 };

    const auctionIds = auctions.map((a) => a.id);
    const bids = await this.bidsRepository.find({ where: { auctionId: In(auctionIds) } });

    const listingIds = auctions.map((a) => a.listingId);
    const [cars, gadgets] = await Promise.all([
      this.carListingsRepository.find({ where: { id: In(listingIds.filter((_, i) => auctions[i].category === ListingCategory.Car)) } }),
      this.gadgetListingsRepository.find({ where: { id: In(listingIds.filter((_, i) => auctions[i].category === ListingCategory.Gadget)) } }),
    ]);
    const listingMap = new Map([...cars, ...gadgets].map((l) => [l.id, l]));

    const bidCountMap = new Map<string, number>();
    const currentBidMap = new Map<string, number>();
    for (const bid of bids) {
      bidCountMap.set(bid.auctionId, (bidCountMap.get(bid.auctionId) ?? 0) + 1);
      const current = currentBidMap.get(bid.auctionId) ?? 0;
      if (bid.amountKobo > current) currentBidMap.set(bid.auctionId, bid.amountKobo);
    }

    const items = auctions.map((auction) => {
      const listing = listingMap.get(auction.listingId);
      const title = listing ? auction.category === ListingCategory.Car ? `${(listing as CarListing).make} ${(listing as CarListing).model} ${(listing as CarListing).year}` : `${(listing as GadgetListing).brand} ${(listing as GadgetListing).model}` : 'Untitled';
      return { id: auction.id, title, category: auction.category, status: auction.status, currentBidKobo: currentBidMap.get(auction.id) ?? auction.basePriceKobo, bidderCount: bidCountMap.get(auction.id) ?? 0, holdPercent: auction.holdPercent, endsAt: auction.endTime, basePriceKobo: auction.basePriceKobo };
    });

    return { items, total: await this.auctionsRepository.count({ where }) };
  }

  async listAdminLedger(query: ListAdminLedgerQueryDto) {
    const qb = this.ledgerRepository.createQueryBuilder('le').leftJoinAndSelect('le.wallet', 'w');

    if (query.type) {
      const typeMap: Record<string, WalletLedgerType[]> = {
        bid_hold: [WalletLedgerType.BidHoldCreated, WalletLedgerType.BidHoldReleased],
        topup: [WalletLedgerType.WalletFundingConfirmed],
        release: [WalletLedgerType.BidHoldReleased],
        payment: [WalletLedgerType.FinalPaymentConfirmed],
        payout: [WalletLedgerType.WithdrawalConfirmed],
      };
      const types = typeMap[query.type];
      if (types) qb.andWhere('le.type IN (:...types)', { types });
    }

    qb.orderBy('le.createdAt', 'DESC').take(query.limit).skip(query.offset);
    const [entries, total] = await qb.getManyAndCount();

    const userIds = [...new Set(entries.map((e: WalletLedgerEntry) => e.userId))];
    const users = userIds.length > 0 ? await this.usersRepository.find({ where: { id: In(userIds) }, select: ['id', 'firstName', 'lastName'] }) : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const items = entries.map((entry: WalletLedgerEntry) => {
      const user = userMap.get(entry.userId);
      return { id: entry.id, ts: entry.createdAt, userId: entry.userId, handle: user ? `@${user.firstName.toLowerCase()}***` : '@unknown', action: entry.type, ref: entry.reference, amountKobo: Math.abs(entry.amountKobo), direction: entry.amountKobo >= 0 ? 'in' : 'out' };
    });

    return { items, total };
  }

  async listNotificationLogs(query: ListNotificationLogsQueryDto) {
    const where: Record<string, unknown> = {};
    if (query.channel) where.channel = query.channel;
    if (query.status) where.status = query.status;
    return { items: await this.deliveryLogsRepository.find({ where, order: { createdAt: 'DESC' }, take: 20 }) };
  }

  async listInAppNotifications() {
    const notifications = await this.notificationsRepository.find({
      order: { createdAt: 'DESC' },
      take: 30,
    });
    const recipientIds = [
      ...new Set(
        notifications
          .map((notification) => notification.recipientId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const users = recipientIds.length
      ? await this.usersRepository.find({
          where: { id: In(recipientIds) },
          select: ['id', 'firstName', 'lastName', 'email'],
        })
      : [];
    const userMap = new Map(users.map((user) => [user.id, user]));

    return {
      items: notifications.map((notification) => {
        const recipient = notification.recipientId
          ? userMap.get(notification.recipientId)
          : null;
        return {
          id: notification.id,
          audience: notification.audience,
          recipientId: notification.recipientId,
          recipient: recipient
            ? `${recipient.firstName} ${recipient.lastName}`.trim() || recipient.email
            : 'All admins',
          type: notification.type,
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt,
        };
      }),
    };
  }

  async getSystemHealth() {
    const services: { name: string; status: string; latency?: number }[] = [];
    const pgStart = Date.now();
    try {
      await this.usersRepository.query('SELECT 1');
      services.push({ name: 'PostgreSQL', status: 'ok', latency: Date.now() - pgStart });
    } catch {
      services.push({ name: 'PostgreSQL', status: 'err', latency: Date.now() - pgStart });
    }

    const strowalletConfigured = Boolean(
      this.config.get<string>('STROWALLET_PUBLIC_KEY') &&
        this.config.get<string>('STROWALLET_SECRET_KEY'),
    );
    services.push({
      name: 'Strowallet API',
      status: strowalletConfigured ? 'ok' : 'warn',
    });
    services.push({ name: 'Socket.IO', status: 'ok' });

    return { services };
  }

  private parseRange(range: string): Date | undefined {
    const map: Record<string, number> = { '1h': 3600000, '24h': 86400000, '7d': 604800000, '30d': 2592000000 };
    const ms = map[range];
    return ms ? new Date(Date.now() - ms) : undefined;
  }

  private mapNotifType(notifType: string): string {
    if (notifType === 'AUCTION_WON') return 'win';
    if (notifType === 'PAYMENT_DUE') return 'pay';
    return 'alert';
  }
}
