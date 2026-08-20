import type { Logger } from '@nestjs/common';
import { In, type EntityManager, type Repository } from 'typeorm';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { BidStatus } from '../../common/enums/bid-status.enum';
import { NotificationAudience } from '../../common/enums/notification-audience.enum';
import type { NotificationType } from '../../common/enums/notification-type.enum';
import { Bid } from '../bids/entities/bid.entity';
import type { NotificationsService } from '../notifications/notifications.service';
import type { WalletsService } from '../wallets/wallets.service';
import type { AuctionLifecycleScheduler } from './auction-lifecycle.scheduler';
import type { Auction } from './entities/auction.entity';

export type LifecycleNotification = {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
};

export async function scheduleOpenLifecycleJobs(
  auctionsRepository: Repository<Auction>,
  scheduler: AuctionLifecycleScheduler,
) {
  const auctions = await auctionsRepository.find({
    where: [
      { status: AuctionStatus.Scheduled },
      { status: AuctionStatus.Live },
      { status: AuctionStatus.AwaitingPayment },
    ],
  });
  await Promise.all(
    auctions.map((auction) =>
      auction.status === AuctionStatus.AwaitingPayment &&
      auction.paymentDeadlineAt
        ? scheduler.schedulePaymentDeadline(auction)
        : scheduler.scheduleAuctionLifecycle(auction),
    ),
  );
}

export function findClosableBids(
  manager: EntityManager,
  auctionId: string,
) {
  return manager.find(Bid, {
    where: {
      auctionId,
      status: In([BidStatus.Accepted, BidStatus.Winning]),
    },
    order: { amountKobo: 'DESC', createdAt: 'ASC' },
    lock: { mode: 'pessimistic_write' },
  });
}

export async function markLosingBids(
  manager: EntityManager,
  walletsService: WalletsService,
  bids: Bid[],
  winningBid: Bid,
) {
  for (const bid of bids.filter((item) => item.id !== winningBid.id)) {
    bid.status = BidStatus.Outbid;
    await manager.save(bid);
    if (bid.walletHoldId) {
      await walletsService.releaseBidHold(manager, {
        holdId: bid.walletHoldId,
        reference: `auction_close_${winningBid.auctionId}_bid_${bid.id}`,
        metadata: {
          auctionId: winningBid.auctionId,
          bidId: bid.id,
          reason: 'auction_closed',
        },
      });
    }
  }
}

export async function createLifecycleNotifications(
  service: NotificationsService,
  logger: Logger,
  notifications: LifecycleNotification[],
) {
  for (const notification of notifications) {
    try {
      await service.create({
        audience: NotificationAudience.User,
        ...notification,
      });
    } catch (error) {
      logger.error(
        error instanceof Error
          ? error.message
          : 'Failed to create auction lifecycle notification',
      );
    }
  }
}
