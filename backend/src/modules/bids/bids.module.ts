import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auction } from '../auctions/entities/auction.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletsModule } from '../wallets/wallets.module';
import { BidsController } from './bids.controller';
import { BidsGateway } from './bids.gateway';
import { BidsService } from './bids.service';
import { Bid } from './entities/bid.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auction, Bid]),
    WalletsModule,
    NotificationsModule,
  ],
  controllers: [BidsController],
  providers: [BidsService, BidsGateway],
  exports: [BidsService, BidsGateway],
})
export class BidsModule {}
