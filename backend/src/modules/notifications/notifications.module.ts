import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationRead } from './entities/notification-read.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { User } from '../users/entities/user.entity';
import { NotificationPreference } from '../users/entities/notification-preference.entity';
import { PlatformToggle } from '../admin/entities/platform-toggle.entity';
import { NotificationDeliveryLog } from '../admin/entities/notification-delivery-log.entity';
import { NotificationDeliveryService } from './notification-delivery.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationRead,
      User,
      NotificationPreference,
      PlatformToggle,
      NotificationDeliveryLog,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationDeliveryService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
