import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingAccessApplication } from '../users/entities/listing-access-application.entity';
import { UserListingPermission } from '../users/entities/user-listing-permission.entity';
import { User } from '../users/entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AccessCode } from './entities/access-code.entity';
import { PlatformFeeSetting } from './entities/platform-fee-setting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      AccessCode,
      ListingAccessApplication,
      UserListingPermission,
      PlatformFeeSetting,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
