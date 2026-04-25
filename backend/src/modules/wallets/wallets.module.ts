import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonnifyProvider } from '../payments/providers/monnify.provider';
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
    {
      provide: MonnifyProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new MonnifyProvider(config),
    },
  ],
  exports: [
    WalletsService,
    WalletFundingService,
    WalletWithdrawalsService,
    MonnifyProvider,
    TypeOrmModule,
  ],
})
export class WalletsModule {}
