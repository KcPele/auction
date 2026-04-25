import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PaymentProvider } from '../../common/enums/payment-provider.enum';
import { WalletFundingAccountStatus } from '../../common/enums/wallet-funding-account-status.enum';
import { WalletLedgerType } from '../../common/enums/wallet-ledger-type.enum';
import { MonnifyProvider } from '../payments/providers/monnify.provider';
import { User } from '../users/entities/user.entity';
import { WalletFundingAccount } from './entities/wallet-funding-account.entity';
import { WalletLedgerEntry } from './entities/wallet-ledger-entry.entity';
import { Wallet } from './entities/wallet.entity';
import { presentFundingAccount } from './presenters/funding-account.presenter';

@Injectable()
export class WalletFundingService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Wallet)
    private readonly walletsRepository: Repository<Wallet>,
    @InjectRepository(WalletFundingAccount)
    private readonly fundingAccountsRepository: Repository<WalletFundingAccount>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly monnifyProvider: MonnifyProvider,
  ) {}

  async getFundingAccount(userId: string) {
    const existing = await this.fundingAccountsRepository.findOneBy({
      userId,
      provider: PaymentProvider.Monnify,
      status: WalletFundingAccountStatus.Active,
    });

    if (existing) {
      return { fundingAccount: presentFundingAccount(existing), created: false };
    }

    const user = await this.usersRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.nin) {
      throw new BadRequestException(
        'NIN is required to create a Monnify funding account',
      );
    }

    const wallet = await this.ensureWallet(userId);
    const accountReference = `wallet_${userId}`;
    const accountName = `${user.firstName} ${user.lastName}`.trim();
    const response = await this.monnifyProvider.createReservedAccount({
      accountReference,
      accountName,
      customerEmail: user.email,
      customerName: accountName,
      nin: user.nin,
    });
    const account = response.accounts[0];

    if (!account) {
      throw new BadRequestException('Monnify did not return a funding account');
    }

    const fundingAccount = await this.fundingAccountsRepository.save(
      this.fundingAccountsRepository.create({
        walletId: wallet.id,
        userId,
        provider: PaymentProvider.Monnify,
        accountReference: response.accountReference,
        accountNumber: account.accountNumber,
        accountName: account.accountName || response.accountName,
        bankName: account.bankName,
        bankCode: account.bankCode ?? null,
        reservationReference: response.reservationReference ?? null,
        status: WalletFundingAccountStatus.Active,
        providerPayload: response as unknown as Record<string, unknown>,
      }),
    );

    return { fundingAccount: presentFundingAccount(fundingAccount), created: true };
  }

  async creditFundingAccount(input: {
    accountReference: string;
    amountKobo: number;
    reference: string;
    metadata: Record<string, unknown>;
  }) {
    return this.dataSource.transaction(async (manager) => {
      const existingLedger = await manager.findOne(WalletLedgerEntry, {
        where: { reference: input.reference },
      });

      if (existingLedger) {
        return { ledgerEntry: existingLedger, alreadyProcessed: true };
      }

      const fundingAccount = await manager.findOne(WalletFundingAccount, {
        where: {
          accountReference: input.accountReference,
          provider: PaymentProvider.Monnify,
          status: WalletFundingAccountStatus.Active,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!fundingAccount) {
        throw new NotFoundException('Funding account not found');
      }

      const wallet = await this.findWalletForUpdate(manager, fundingAccount.walletId);
      const balanceBeforeKobo = wallet.balanceKobo;
      wallet.balanceKobo += input.amountKobo;

      await manager.save(wallet);

      const ledgerEntry = await this.writeLedger(manager, wallet, {
        type: WalletLedgerType.WalletFundingConfirmed,
        amountKobo: input.amountKobo,
        balanceBeforeKobo,
        reference: input.reference,
        metadata: {
          ...input.metadata,
          fundingAccountId: fundingAccount.id,
        },
      });

      return { ledgerEntry, wallet, alreadyProcessed: false };
    });
  }

  private async ensureWallet(userId: string) {
    const existing = await this.walletsRepository.findOneBy({ userId });

    if (existing) {
      return existing;
    }

    return this.walletsRepository.save(this.walletsRepository.create({ userId }));
  }

  private async findWalletForUpdate(manager: EntityManager, walletId: string) {
    const wallet = await manager.findOne(Wallet, {
      where: { id: walletId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  private writeLedger(
    manager: EntityManager,
    wallet: Wallet,
    input: {
      type: WalletLedgerType;
      amountKobo: number;
      balanceBeforeKobo: number;
      reference: string;
      metadata: Record<string, unknown>;
    },
  ) {
    return manager.save(
      manager.create(WalletLedgerEntry, {
        walletId: wallet.id,
        userId: wallet.userId,
        type: input.type,
        amountKobo: input.amountKobo,
        balanceBeforeKobo: input.balanceBeforeKobo,
        balanceAfterKobo: wallet.balanceKobo,
        heldBeforeKobo: wallet.heldKobo,
        heldAfterKobo: wallet.heldKobo,
        reference: input.reference,
        metadata: input.metadata,
      }),
    );
  }
}
