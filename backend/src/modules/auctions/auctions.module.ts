import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformFeeSetting } from '../admin/entities/platform-fee-setting.entity';
import { Bid } from '../bids/entities/bid.entity';
import { CarListing } from '../cars/entities/car-listing.entity';
import { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
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
  ],
  controllers: [AuctionsController],
  providers: [AuctionsService],
  exports: [AuctionsService, TypeOrmModule],
})
export class AuctionsModule {}
