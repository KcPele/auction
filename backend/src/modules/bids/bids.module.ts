import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auction } from '../auctions/entities/auction.entity';
import { WalletsModule } from '../wallets/wallets.module';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';
import { Bid } from './entities/bid.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Auction, Bid]), WalletsModule],
  controllers: [BidsController],
  providers: [BidsService],
})
export class BidsModule {}
