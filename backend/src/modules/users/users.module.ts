import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessCode } from '../admin/entities/access-code.entity';
import { ListingAccessApplication } from './entities/listing-access-application.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { UserListingPermission } from './entities/user-listing-permission.entity';
import { User } from './entities/user.entity';
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
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
