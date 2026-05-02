import { PaymentProvider } from '../../common/enums/payment-provider.enum';
import { WalletFundingAccountStatus } from '../../common/enums/wallet-funding-account-status.enum';
import { WalletLedgerType } from '../../common/enums/wallet-ledger-type.enum';
import type { StrowalletProvider } from '../payments/providers/strowallet.provider';
import { User } from '../users/entities/user.entity';
import { WalletFundingAccount } from './entities/wallet-funding-account.entity';
import { WalletLedgerEntry } from './entities/wallet-ledger-entry.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletFundingService } from './wallet-funding.service';

describe('WalletFundingService', () => {
  let service: WalletFundingService;
  let dataSource: { transaction: jest.Mock };
  let walletsRepository: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let fundingAccountsRepository: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let usersRepository: { findOneBy: jest.Mock };
  let strowalletProvider: { createVirtualAccount: jest.Mock };

  beforeEach(() => {
    dataSource = { transaction: jest.fn((callback) => callback(createManager())) };
    walletsRepository = {
      findOneBy: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => createWallet(value)),
    };
    fundingAccountsRepository = {
      findOneBy: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({
        id: 'funding-account-id',
        createdAt: new Date('2026-04-24T12:00:00.000Z'),
        updatedAt: new Date('2026-04-24T12:00:00.000Z'),
        ...value,
      })),
    };
    usersRepository = { findOneBy: jest.fn() };
    strowalletProvider = { createVirtualAccount: jest.fn() };
    service = new WalletFundingService(
      dataSource as never,
      walletsRepository as never,
      fundingAccountsRepository as never,
      usersRepository as never,
      strowalletProvider as unknown as StrowalletProvider,
    );
  });

  it('creates a Strowallet funding account for a user', async () => {
    fundingAccountsRepository.findOneBy.mockResolvedValue(null);
    walletsRepository.findOneBy.mockResolvedValue(createWallet());
    usersRepository.findOneBy.mockResolvedValue({
      id: 'user-id',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '08123456789',
    });
    strowalletProvider.createVirtualAccount.mockResolvedValue({
      sessionId: 'session-id',
      bankCode: '50515',
      bankName: 'Nombank MFB',
      accountNumber: '6254727989',
      accountName: 'Ada Lovelace',
    });

    await expect(service.getFundingAccount('user-id')).resolves.toEqual({
      fundingAccount: expect.objectContaining({
        accountNumber: '6254727989',
        provider: PaymentProvider.Strowallet,
      }),
      created: true,
    });
    expect(strowalletProvider.createVirtualAccount).toHaveBeenCalledWith({
      email: 'ada@example.com',
      accountName: 'Ada Lovelace',
      phone: '08123456789',
    });
  });

  it('credits a wallet from a Strowallet funding webhook', async () => {
    const wallet = createWallet({ balanceKobo: 10000 });
    const fundingAccount = { id: 'funding-account-id', walletId: wallet.id };
    const manager = createManager({ wallet, fundingAccount });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(
      service.creditFundingAccount({
        accountReference: 'wallet_user-id',
        amountKobo: 50000,
        reference: 'strowallet-reference',
        metadata: {},
      }),
    ).resolves.toEqual(expect.objectContaining({ alreadyProcessed: false }));
    expect(wallet.balanceKobo).toBe(60000);
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WalletLedgerType.WalletFundingConfirmed,
        amountKobo: 50000,
      }),
    );
  });
});

function createWallet(overrides: Record<string, unknown> = {}) {
  return {
    id: 'wallet-id',
    userId: 'user-id',
    currency: 'NGN',
    balanceKobo: 0,
    heldKobo: 0,
    ...overrides,
  };
}

function createManager(input?: {
  wallet?: Record<string, unknown>;
  fundingAccount?: Record<string, unknown> | null;
  ledgerEntry?: Record<string, unknown> | null;
}) {
  return {
    create: jest.fn((_entity, value) => value),
    save: jest.fn(async (value) => value),
    findOne: jest.fn((entity) => {
      if (entity === Wallet) {
        return Promise.resolve(input?.wallet ?? null);
      }

      if (entity === WalletFundingAccount) {
        return Promise.resolve({
          provider: PaymentProvider.Strowallet,
          status: WalletFundingAccountStatus.Active,
          ...input?.fundingAccount,
        });
      }

      if (entity === WalletLedgerEntry) {
        return Promise.resolve(input?.ledgerEntry ?? null);
      }

      if (entity === User) {
        return Promise.resolve({ id: 'user-id' });
      }

      return Promise.resolve(null);
    }),
  };
}
