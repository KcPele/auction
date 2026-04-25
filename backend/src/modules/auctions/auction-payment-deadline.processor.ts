import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import {
  PaymentDeadlineJobData,
  PaymentDeadlineJobNames,
} from '../../common/constants/auction-lifecycle-jobs';
import { QueueNames } from '../../common/constants/queue-names';
import { AuctionSettlementService } from './auction-settlement.service';

@Processor(QueueNames.PaymentDeadlines)
export class AuctionPaymentDeadlineProcessor extends WorkerHost {
  private readonly logger = new Logger(AuctionPaymentDeadlineProcessor.name);

  constructor(private readonly settlementService: AuctionSettlementService) {
    super();
  }

  async process(job: Job<PaymentDeadlineJobData>) {
    if (job.name === PaymentDeadlineJobNames.Forfeit) {
      return this.settlementService.defaultAuctionPayment(job.data.auctionId);
    }

    this.logger.warn(`Unknown payment deadline job: ${job.name}`);
    return { skipped: true };
  }
}
