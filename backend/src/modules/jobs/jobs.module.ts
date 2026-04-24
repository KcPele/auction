import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QueueNames } from '../../common/constants/queue-names';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QueueNames.AuctionLifecycle },
      { name: QueueNames.PaymentDeadlines },
      { name: QueueNames.Notifications },
      { name: QueueNames.WalletMaintenance },
    ),
  ],
})
export class JobsModule {}

