import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletLedgerType } from '../../common/enums/wallet-ledger-type.enum';
import { WalletWithdrawalStatus } from '../../common/enums/wallet-withdrawal-status.enum';
import type { StrowalletProvider } from '../payments/providers/strowallet.provider';
import { WalletLedgerEntry } from './entities/wallet-ledger-entry.entity';
import { WalletWithdrawal } from './entities/wallet-withdrawal.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletWithdrawalsService } from './wallet-withdrawals.service';

describe('WalletWithdrawalsService', () => {
  let service: WalletWithdrawalsService;
  let dataSource: { transaction: jest.Mock };
  let withdrawalsRepository: { find: jest.Mock; findOneBy: jest.Mock };
  let strowalletProvider: {
    getAccountName: jest.Mock;
    initiateBankTransfer: jest.Mock;
  };

  beforeEach(() => {
    dataSource = { transaction: jest.fn((callback) => callback(createManager())) };
    withdrawalsRepository = { find: jest.fn(), findOneBy: jest.fn() };
    strowalletProvider = {
      getAccountName: jest.fn(),
      initiateBankTransfer: jest.fn(),
    };
    service = new WalletWithdrawalsService(
      dataSource as never,
      withdrawalsRepository as never,
      strowalletProvider as unknown as StrowalletProvider,
    );
  });

  it('rejects withdrawals above available balance', async () => {
    const manager = createManager({
      wallet: createWallet({ balanceKobo: 10000, heldKobo: 5000 }),
    });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(
      service.createWithdrawal('user-id', createWithdrawalDto({ amountKobo: 6000 })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a withdrawal and sends it to Strowallet', async () => {
    const wallet = createWallet({ balanceKobo: 100000 });
    const manager = createManager({ wallet });
    dataSource.transaction.mockImplementation((callback) => callback(manager));
    strowalletProvider.getAccountName.mockResolvedValue({
      name_enquiry_reference: 'name-enquiry-reference',
    });
    strowalletProvider.initiateBankTransfer.mockResolvedValue({
      reference: 'wallet_withdrawal_reference',
      status: 'SUCCESS',
    });

    await expect(
      service.createWithdrawal('user-id', createWithdrawalDto()),
    ).resolves.toEqual({
      withdrawal: expect.objectContaining({
        status: WalletWithdrawalStatus.Completed,
      }),
      payout: expect.objectContaining({ status: 'SUCCESS' }),
    });
    expect(wallet.balanceKobo).toBe(50000);
  });

  it('refunds failed withdrawals', async () => {
    const wallet = createWallet({ balanceKobo: 50000 });
    const withdrawal = createWithdrawal();
    const manager = createManager({ wallet, withdrawal });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(
      service.updateWithdrawalFromProvider(
        withdrawal.providerReference,
        'FAILED',
        {},
      ),
    ).resolves.toEqual(expect.objectContaining({ status: 'FAILED' }));
    expect(wallet.balanceKobo).toBe(100000);
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WalletLedgerType.WithdrawalFailed,
        amountKobo: 50000,
      }),
    );
  });

  it('returns a user withdrawal by id', async () => {
    withdrawalsRepository.findOneBy.mockResolvedValue(createWithdrawal());

    await expect(
      service.getWithdrawal('user-id', 'withdrawal-id'),
    ).resolves.toEqual({
      withdrawal: expect.objectContaining({ id: 'withdrawal-id' }),
    });
  });

  it('requires an existing withdrawal', async () => {
    withdrawalsRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.getWithdrawal('user-id', 'missing-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists pending withdrawals for admin authorization', async () => {
    withdrawalsRepository.find.mockResolvedValue([
      createWithdrawal({ id: 'withdrawal-a' }),
    ]);

    await expect(service.listPendingWithdrawals()).resolves.toEqual({
      withdrawals: [expect.objectContaining({ id: 'withdrawal-a' })],
    });
    expect(withdrawalsRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { createdAt: 'ASC' } }),
    );
  });

  it('does not authorize Strowallet withdrawals with OTP', async () => {
    const withdrawal = createWithdrawal();
    withdrawalsRepository.findOneBy.mockResolvedValue(withdrawal);

    await expect(
      service.authorizeWithdrawal('withdrawal-id', '886850'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns a Strowallet withdrawal OTP resend message', async () => {
    const withdrawal = createWithdrawal();
    withdrawalsRepository.findOneBy.mockResolvedValue(withdrawal);

    await expect(
      service.resendWithdrawalOtp('withdrawal-id'),
    ).resolves.toEqual({
      withdrawal: expect.objectContaining({ id: 'withdrawal-id' }),
      providerResponse: expect.objectContaining({
        message: expect.stringContaining('Strowallet'),
      }),
    });
  });

  it('does not authorize completed withdrawals', async () => {
    withdrawalsRepository.findOneBy.mockResolvedValue(
      createWithdrawal({ status: WalletWithdrawalStatus.Completed }),
    );

    await expect(
      service.authorizeWithdrawal('withdrawal-id', '886850'),
    ).rejects.toBeInstanceOf(BadRequestException);
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

function createWithdrawal(overrides: Record<string, unknown> = {}) {
  return {
    id: 'withdrawal-id',
    walletId: 'wallet-id',
    userId: 'user-id',
    amountKobo: 50000,
    status: WalletWithdrawalStatus.Processing,
    providerReference: 'wallet_withdrawal_reference',
    createdAt: new Date('2026-04-24T12:00:00.000Z'),
    updatedAt: new Date('2026-04-24T12:00:00.000Z'),
    ...overrides,
  };
}

function createWithdrawalDto(overrides: Record<string, unknown> = {}) {
  return {
    amountKobo: 50000,
    destinationBankCode: '057',
    destinationBankName: 'Zenith Bank',
    destinationAccountNumber: '2085096393',
    destinationAccountName: 'Ada Lovelace',
    ...overrides,
  };
}

function createManager(input?: {
  wallet?: Record<string, unknown>;
  withdrawal?: Record<string, unknown> | null;
}) {
  let savedWithdrawal = input?.withdrawal ?? null;

  return {
    create: jest.fn((_entity, value) => value),
    save: jest.fn(async (value) => {
      if ('destinationBankCode' in value) {
        savedWithdrawal = createWithdrawal(value);
        return savedWithdrawal;
      }

      return value;
    }),
    findOne: jest.fn((entity) => {
      if (entity === Wallet) {
        return Promise.resolve(input?.wallet ?? null);
      }

      if (entity === WalletWithdrawal) {
        return Promise.resolve(savedWithdrawal);
      }

      if (entity === WalletLedgerEntry) {
        return Promise.resolve(null);
      }

      return Promise.resolve(null);
    }),
  };
}
