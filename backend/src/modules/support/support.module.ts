import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Auction } from '../auctions/entities/auction.entity';
import { Bid } from '../bids/entities/bid.entity';
import { CarListing } from '../cars/entities/car-listing.entity';
import { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationRead } from '../notifications/entities/notification-read.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { Wallet } from '../wallets/entities/wallet.entity';
import { SupportAdminController } from './support-admin.controller';
import { SupportController } from './support.controller';
import { SupportGateway } from './support.gateway';
import { SupportService } from './support.service';
import { SupportAiTools } from './support-ai.tools';
import { SupportAiSetting } from './entities/support-ai-setting.entity';
import { SupportConversation } from './entities/support-conversation.entity';
import { SupportMessage } from './entities/support-message.entity';
import { User } from '../users/entities/user.entity';
import { OpenRouterClient } from './openrouter.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupportConversation,
      SupportMessage,
      SupportAiSetting,
      // Read-only repos used by AI tools (no writes).
      Wallet,
      Bid,
      Auction,
      CarListing,
      GadgetListing,
      Notification,
      NotificationRead,
      User,
    ]),
    forwardRef(() => AuthModule),
    NotificationsModule,
  ],
  controllers: [SupportController, SupportAdminController],
  providers: [SupportService, SupportAiTools, OpenRouterClient, SupportGateway],
  exports: [SupportService],
})
export class SupportModule {}
