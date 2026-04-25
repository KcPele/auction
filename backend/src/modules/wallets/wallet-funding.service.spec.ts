import { BadRequestException } from '@nestjs/common';
import { PaymentProvider } from '../../common/enums/payment-provider.enum';
import { WalletFundingAccountStatus } from '../../common/enums/wallet-funding-account-status.enum';
import { WalletLedgerType } from '../../common/enums/wallet-ledger-type.enum';
import type { MonnifyProvider } from '../payments/providers/monnify.provider';
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
  let monnifyProvider: { createReservedAccount: jest.Mock };

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
    monnifyProvider = { createReservedAccount: jest.fn() };
    service = new WalletFundingService(
      dataSource as never,
      walletsRepository as never,
      fundingAccountsRepository as never,
      usersRepository as never,
      monnifyProvider as unknown as MonnifyProvider,
    );
  });

  it('creates a Monnify funding account for a user with NIN', async () => {
    fundingAccountsRepository.findOneBy.mockResolvedValue(null);
    walletsRepository.findOneBy.mockResolvedValue(createWallet());
    usersRepository.findOneBy.mockResolvedValue({
      id: 'user-id',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      nin: '12345678901',
    });
    monnifyProvider.createReservedAccount.mockResolvedValue({
      accountReference: 'wallet_user-id',
      accountName: 'Ada Lovelace',
      reservationReference: 'reservation-id',
      accounts: [
        {
          bankCode: '50515',
          bankName: 'Moniepoint Microfinance Bank',
          accountNumber: '6254727989',
          accountName: 'Ada Lovelace',
        },
      ],
    });

    await expect(service.getFundingAccount('user-id')).resolves.toEqual({
      fundingAccount: expect.objectContaining({
        accountNumber: '6254727989',
        provider: PaymentProvider.Monnify,
      }),
      created: true,
    });
  });

  it('requires NIN before creating a Monnify funding account', async () => {
    fundingAccountsRepository.findOneBy.mockResolvedValue(null);
    usersRepository.findOneBy.mockResolvedValue({ id: 'user-id', nin: null });

    await expect(service.getFundingAccount('user-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('credits a wallet from a Monnify funding webhook', async () => {
    const wallet = createWallet({ balanceKobo: 10000 });
    const fundingAccount = { id: 'funding-account-id', walletId: wallet.id };
    const manager = createManager({ wallet, fundingAccount });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(
      service.creditFundingAccount({
        accountReference: 'wallet_user-id',
        amountKobo: 50000,
        reference: 'MNFY|reference',
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
          provider: PaymentProvider.Monnify,
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
