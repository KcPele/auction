import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformFeeSetting } from '../admin/entities/platform-fee-setting.entity';
import { Bid } from '../bids/entities/bid.entity';
import { CarListing } from '../cars/entities/car-listing.entity';
import { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
import { JobsModule } from '../jobs/jobs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletsModule } from '../wallets/wallets.module';
import { AuctionLifecycleProcessor } from './auction-lifecycle.processor';
import { AuctionLifecycleScheduler } from './auction-lifecycle.scheduler';
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
    ]),
    JobsModule,
    NotificationsModule,
    WalletsModule,
  ],
  controllers: [AuctionsController],
  providers: [
    AuctionsService,
    AuctionLifecycleProcessor,
    AuctionLifecycleScheduler,
  ],
  exports: [AuctionsService, TypeOrmModule],
})
export class AuctionsModule {}
