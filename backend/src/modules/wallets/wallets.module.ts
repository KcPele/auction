import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrowalletProvider } from '../payments/providers/strowallet.provider';
import { User } from '../users/entities/user.entity';
import { WalletFundingAccount } from './entities/wallet-funding-account.entity';
import { WalletHold } from './entities/wallet-hold.entity';
import { WalletLedgerEntry } from './entities/wallet-ledger-entry.entity';
import { WalletWithdrawal } from './entities/wallet-withdrawal.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletsController } from './wallets.controller';
import { WalletFundingService } from './wallet-funding.service';
import { WalletWithdrawalsService } from './wallet-withdrawals.service';
import { WalletsService } from './wallets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
      WalletLedgerEntry,
      WalletHold,
      WalletFundingAccount,
      WalletWithdrawal,
      User,
    ]),
  ],
  controllers: [WalletsController],
  providers: [
    WalletsService,
    WalletFundingService,
    WalletWithdrawalsService,
    StrowalletProvider,
  ],
  exports: [
    WalletsService,
    WalletFundingService,
    WalletWithdrawalsService,
    StrowalletProvider,
    TypeOrmModule,
  ],
})
export class WalletsModule {}
