import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessCode } from '../admin/entities/access-code.entity';
import { Auction } from '../auctions/entities/auction.entity';
import { AuctionDelivery } from '../auctions/entities/auction-delivery.entity';
import { Bid } from '../bids/entities/bid.entity';
import { CarListing } from '../cars/entities/car-listing.entity';
import { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
import { ListingAccessApplication } from './entities/listing-access-application.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { UserListingPermission } from './entities/user-listing-permission.entity';
import { User } from './entities/user.entity';
import { Watchlist } from './entities/watchlist.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      NotificationPreference,
      ListingAccessApplication,
      UserListingPermission,
      AccessCode,
      Bid,
      Auction,
      CarListing,
      GadgetListing,
      Watchlist,
      AuctionDelivery,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
