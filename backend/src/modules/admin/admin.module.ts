import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingAccessApplication } from '../users/entities/listing-access-application.entity';
import { UserListingPermission } from '../users/entities/user-listing-permission.entity';
import { User } from '../users/entities/user.entity';
import { CarListing } from '../cars/entities/car-listing.entity';
import { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
import { Auction } from '../auctions/entities/auction.entity';
import { Bid } from '../bids/entities/bid.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletLedgerEntry } from '../wallets/entities/wallet-ledger-entry.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { AuctionsModule } from '../auctions/auctions.module';
import { WalletsModule } from '../wallets/wallets.module';
import { AdminController } from './admin.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDisputesService } from './admin-disputes.service';
import { AdminListingsService } from './admin-listings.service';
import { AdminMechanicsService } from './admin-mechanics.service';
import { AdminSettingsService } from './admin-settings.service';
import { AdminUsersService } from './admin-users.service';
import { AccessCode } from './entities/access-code.entity';
import { BiddingSetting } from './entities/bidding-setting.entity';
import { Dispute } from './entities/dispute.entity';
import { EscrowSetting } from './entities/escrow-setting.entity';
import { MechanicProfile } from './entities/mechanic-profile.entity';
import { NotificationDeliveryLog } from './entities/notification-delivery-log.entity';
import { PaymentAccountSetting } from './entities/payment-account-setting.entity';
import { PlatformToggle } from './entities/platform-toggle.entity';
import { PlatformFeeSetting } from './entities/platform-fee-setting.entity';

@Module({
  imports: [
    AuctionsModule,
    WalletsModule,
    TypeOrmModule.forFeature([
      User,
      AccessCode,
      ListingAccessApplication,
      UserListingPermission,
      BiddingSetting,
      PlatformFeeSetting,
      PaymentAccountSetting,
      CarListing,
      GadgetListing,
      Auction,
      Bid,
      Wallet,
      WalletLedgerEntry,
      Notification,
      Dispute,
      MechanicProfile,
      NotificationDeliveryLog,
      EscrowSetting,
      PlatformToggle,
    ]),
  ],
  controllers: [AdminController],
  providers: [
    AdminDashboardService,
    AdminUsersService,
    AdminDisputesService,
    AdminMechanicsService,
    AdminListingsService,
    AdminSettingsService,
  ],
  exports: [
    AdminDashboardService,
    AdminUsersService,
    AdminDisputesService,
    AdminMechanicsService,
    AdminListingsService,
    AdminSettingsService,
  ],
})
export class AdminModule {}
