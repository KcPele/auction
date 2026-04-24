import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletHold } from './entities/wallet-hold.entity';
import { WalletLedgerEntry } from './entities/wallet-ledger-entry.entity';
import { WalletTopUp } from './entities/wallet-top-up.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
      WalletLedgerEntry,
      WalletTopUp,
      WalletHold,
    ]),
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService, TypeOrmModule],
})
export class WalletsModule {}
