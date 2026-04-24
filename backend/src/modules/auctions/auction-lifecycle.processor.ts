import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import {
  AuctionLifecycleJobData,
  AuctionLifecycleJobNames,
} from '../../common/constants/auction-lifecycle-jobs';
import { QueueNames } from '../../common/constants/queue-names';
import { AuctionsService } from './auctions.service';

@Processor(QueueNames.AuctionLifecycle)
export class AuctionLifecycleProcessor extends WorkerHost {
  private readonly logger = new Logger(AuctionLifecycleProcessor.name);

  constructor(private readonly auctionsService: AuctionsService) {
    super();
  }

  async process(job: Job<AuctionLifecycleJobData>) {
    if (job.name === AuctionLifecycleJobNames.Start) {
      return this.auctionsService.startScheduledAuction(job.data.auctionId);
    }

    if (job.name === AuctionLifecycleJobNames.Close) {
      return this.auctionsService.closeAuction(job.data.auctionId);
    }

    this.logger.warn(`Unknown auction lifecycle job: ${job.name}`);
    return { skipped: true };
  }
}
