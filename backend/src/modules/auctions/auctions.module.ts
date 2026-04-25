import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformFeeSetting } from '../admin/entities/platform-fee-setting.entity';
import { PaymentAccountSetting } from '../admin/entities/payment-account-setting.entity';
import { BiddingSetting } from '../admin/entities/bidding-setting.entity';
import { Bid } from '../bids/entities/bid.entity';
import { CarListing } from '../cars/entities/car-listing.entity';
import { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
import { JobsModule } from '../jobs/jobs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuctionLifecycleProcessor } from './auction-lifecycle.processor';
import { AuctionLifecycleScheduler } from './auction-lifecycle.scheduler';
import { AuctionPaymentDeadlineProcessor } from './auction-payment-deadline.processor';
import { AuctionSettlementService } from './auction-settlement.service';
import { AuctionsController } from './auctions.controller';
import { AuctionsService } from './auctions.service';
import { Auction } from './entities/auction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Auction,
      Bid,
      CarListing,
      GadgetListing,
      PlatformFeeSetting,
      PaymentAccountSetting,
      BiddingSetting,
    ]),
    JobsModule,
    NotificationsModule,
  ],
  controllers: [AuctionsController],
  providers: [
    AuctionsService,
    AuctionSettlementService,
    AuctionLifecycleProcessor,
    AuctionPaymentDeadlineProcessor,
    AuctionLifecycleScheduler,
  ],
  exports: [AuctionsService, AuctionSettlementService, TypeOrmModule],
})
export class AuctionsModule {}
