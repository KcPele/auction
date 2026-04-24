import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import {
  AuctionLifecycleJobData,
  AuctionLifecycleJobNames,
  PaymentDeadlineJobData,
  PaymentDeadlineJobNames,
} from '../../common/constants/auction-lifecycle-jobs';
import { QueueNames } from '../../common/constants/queue-names';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { Auction } from './entities/auction.entity';

@Injectable()
export class AuctionLifecycleScheduler {
  constructor(
    @InjectQueue(QueueNames.AuctionLifecycle)
    private readonly auctionLifecycleQueue: Queue<AuctionLifecycleJobData>,
    @InjectQueue(QueueNames.PaymentDeadlines)
    private readonly paymentDeadlinesQueue: Queue<PaymentDeadlineJobData>,
  ) {}

  async scheduleAuctionLifecycle(auction: Auction) {
    if (auction.status === AuctionStatus.Scheduled) {
      await this.scheduleAuctionStart(auction);
    }

    if ([AuctionStatus.Scheduled, AuctionStatus.Live].includes(auction.status)) {
      await this.scheduleAuctionClose(auction);
    }
  }

  async scheduleAuctionStart(auction: Auction) {
    await this.auctionLifecycleQueue.add(
      AuctionLifecycleJobNames.Start,
      { auctionId: auction.id },
      {
        jobId: `auction:${auction.id}:start`,
        delay: this.delayUntil(auction.startTime),
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }

  async scheduleAuctionClose(auction: Auction) {
    await this.auctionLifecycleQueue.add(
      AuctionLifecycleJobNames.Close,
      { auctionId: auction.id },
      {
        jobId: `auction:${auction.id}:close`,
        delay: this.delayUntil(auction.endTime),
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }

  async schedulePaymentDeadline(auction: Auction) {
    if (!auction.paymentDeadlineAt) {
      return;
    }

    await this.paymentDeadlinesQueue.add(
      PaymentDeadlineJobNames.Forfeit,
      { auctionId: auction.id },
      {
        jobId: `auction:${auction.id}:payment-deadline`,
        delay: this.delayUntil(auction.paymentDeadlineAt),
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }

  private delayUntil(date: Date) {
    return Math.max(date.getTime() - Date.now(), 0);
  }
}
