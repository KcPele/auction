import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserListingPermission } from '../users/entities/user-listing-permission.entity';
import { CarsController } from './cars.controller';
import { CarsService } from './cars.service';
import { CarListing } from './entities/car-listing.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CarListing, UserListingPermission])],
  controllers: [CarsController],
  providers: [CarsService],
  exports: [CarsService],
})
export class CarsModule {}
