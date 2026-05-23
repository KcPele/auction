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
import { StrowalletProvider } from '../payments/providers/strowallet.provider';
import { User } from '../users/entities/user.entity';
import { InitiateTopupDto } from './dto/initiate-topup.dto';
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
    private readonly strowalletProvider: StrowalletProvider,
  ) {}

  async getFundingAccount(userId: string) {
    const existing = await this.fundingAccountsRepository.findOneBy({
      userId,
      provider: PaymentProvider.Strowallet,
      status: WalletFundingAccountStatus.Active,
    });

    if (existing) {
      return { fundingAccount: presentFundingAccount(existing), created: false };
    }

    const user = await this.usersRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wallet = await this.ensureWallet(userId);
    const accountReference = `wallet_${userId}`;
    const accountName = `${user.firstName} ${user.lastName}`.trim();
    const response = await this.strowalletProvider.createVirtualAccount({
      email: user.email,
      accountName,
      phone: user.phone,
    });
    const account = this.parseVirtualAccount(response);

    if (!account) {
      throw new BadRequestException('Strowallet did not return a funding account');
    }

    const fundingAccount = await this.fundingAccountsRepository.save(
      this.fundingAccountsRepository.create({
        walletId: wallet.id,
        userId,
        provider: PaymentProvider.Strowallet,
        accountReference,
        accountNumber: account.accountNumber,
        accountName: account.accountName || accountName,
        bankName: account.bankName,
        bankCode: account.bankCode ?? null,
        reservationReference: account.providerReference ?? null,
        status: WalletFundingAccountStatus.Active,
        providerPayload: response as unknown as Record<string, unknown>,
      }),
    );

    return { fundingAccount: presentFundingAccount(fundingAccount), created: true };
  }

  async initiateTopup(userId: string, _dto: InitiateTopupDto) {
    const { fundingAccount } = await this.getFundingAccount(userId);

    return {
      accountNumber: fundingAccount.accountNumber,
      bankName: fundingAccount.bankName,
      accountName: fundingAccount.accountName,
      reference: fundingAccount.accountReference,
    };
  }

  async creditFundingAccount(input: {
    accountReference?: string;
    accountNumber?: string;
    amountKobo: number;
    reference: string;
    metadata: Record<string, unknown>;
  }) {
    if (!input.accountReference && !input.accountNumber) {
      throw new BadRequestException('Funding account reference is required');
    }

    return this.dataSource.transaction(async (manager) => {
      const existingLedger = await manager.findOne(WalletLedgerEntry, {
        where: { reference: input.reference },
      });

      if (existingLedger) {
        return { ledgerEntry: existingLedger, alreadyProcessed: true };
      }

      const fundingAccount = await manager.findOne(WalletFundingAccount, {
        where: {
          ...(input.accountReference
            ? { accountReference: input.accountReference }
            : { accountNumber: input.accountNumber }),
          provider: PaymentProvider.Strowallet,
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

  private parseVirtualAccount(response: Record<string, unknown>) {
    // Strowallet returns flat snake_case fields at the top level
    // (account_number, account_name, bank_name), but some other providers/
    // shapes nest under an accounts[] array — handle both.
    const account = Array.isArray(response.accounts)
      ? (response.accounts[0] as Record<string, unknown> | undefined)
      : response;
    const accountNumber =
      this.readOptional(account, 'accountNumber') ??
      this.readOptional(account, 'account_number') ??
      this.readOptional(response, 'account_number');

    if (!accountNumber) {
      return null;
    }

    return {
      accountNumber,
      accountName:
        this.readOptional(account, 'accountName') ??
        this.readOptional(account, 'account_name') ??
        this.readOptional(response, 'account_name'),
      bankName:
        this.readOptional(account, 'bankName') ??
        this.readOptional(account, 'bank_name') ??
        this.readOptional(response, 'bank_name') ??
        'Strowallet',
      bankCode:
        this.readOptional(account, 'bankCode') ??
        this.readOptional(account, 'bank_code'),
      providerReference:
        this.readOptional(response, 'sessionId') ??
        this.readOptional(response, 'reservationReference') ??
        this.readOptional(response, 'settlementId') ??
        this.readOptional(response, 'customer_id') ??
        this.readOptional(response, 'customerId'),
    };
  }

  private readOptional(source: unknown, key: string) {
    if (!source || typeof source !== 'object') return null;
    const value = (source as Record<string, unknown>)[key];
    if (value == null) return null;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string' && value.trim()) return value.trim();
    return null;
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
