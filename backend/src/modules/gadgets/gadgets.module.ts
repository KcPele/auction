import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserListingPermission } from '../users/entities/user-listing-permission.entity';
import { GadgetListing } from './entities/gadget-listing.entity';
import { GadgetsController } from './gadgets.controller';
import { GadgetsService } from './gadgets.service';

@Module({
  imports: [TypeOrmModule.forFeature([GadgetListing, UserListingPermission])],
  controllers: [GadgetsController],
  providers: [GadgetsService],
  exports: [GadgetsService],
})
export class GadgetsModule {}
