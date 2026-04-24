import { NotFoundException } from '@nestjs/common';
import { PaymentProvider } from '../../common/enums/payment-provider.enum';
import { TopUpStatus } from '../../common/enums/top-up-status.enum';
import { WalletLedgerType } from '../../common/enums/wallet-ledger-type.enum';
import { WalletTopUp } from './entities/wallet-top-up.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletsService } from './wallets.service';

describe('WalletsService', () => {
  let dataSource: { transaction: jest.Mock };
  let walletsRepository: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let ledgerRepository: { find: jest.Mock };
  let topUpsRepository: { findOneBy: jest.Mock };
  let service: WalletsService;

  beforeEach(() => {
    dataSource = { transaction: jest.fn((callback) => callback(createManager())) };
    walletsRepository = {
      findOneBy: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({
        id: 'wallet-id',
        currency: 'NGN',
        balanceKobo: 0,
        heldKobo: 0,
        createdAt: new Date('2026-04-24T12:00:00.000Z'),
        updatedAt: new Date('2026-04-24T12:00:00.000Z'),
        ...value,
      })),
    };
    ledgerRepository = { find: jest.fn() };
    topUpsRepository = { findOneBy: jest.fn() };
    service = new WalletsService(
      dataSource as never,
      walletsRepository as never,
      ledgerRepository as never,
      topUpsRepository as never,
    );
  });

  it('creates a wallet when the current user has none', async () => {
    walletsRepository.findOneBy.mockResolvedValue(null);

    await expect(service.getWallet('user-id')).resolves.toEqual({
      wallet: expect.objectContaining({
        userId: 'user-id',
        balanceKobo: 0,
        heldKobo: 0,
        availableKobo: 0,
      }),
    });
    expect(walletsRepository.save).toHaveBeenCalledWith({ userId: 'user-id' });
  });

  it('lists ledger entries for the user wallet', async () => {
    walletsRepository.findOneBy.mockResolvedValue({ id: 'wallet-id' });
    ledgerRepository.find.mockResolvedValue([{ id: 'entry-id' }]);

    await expect(
      service.listLedger('user-id', { limit: 10, offset: 5 }),
    ).resolves.toEqual({ ledgerEntries: [{ id: 'entry-id' }] });
    expect(ledgerRepository.find).toHaveBeenCalledWith({
      where: { walletId: 'wallet-id' },
      order: { createdAt: 'DESC' },
      take: 10,
      skip: 5,
    });
  });

  it('confirms a pending top-up and writes the ledger movement', async () => {
    const wallet = {
      id: 'wallet-id',
      userId: 'user-id',
      balanceKobo: 10000,
      heldKobo: 0,
    };
    const topUp = {
      id: 'top-up-id',
      walletId: wallet.id,
      userId: wallet.userId,
      amountKobo: 50000,
      status: TopUpStatus.Pending,
      providerReference: 'reference-id',
    };
    const manager = createManager({ wallet, topUp });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(
      service.confirmTopUpByReference('reference-id', { status: 'SUCCESS' }),
    ).resolves.toEqual({
      topUp: expect.objectContaining({ status: TopUpStatus.Confirmed }),
      alreadyProcessed: false,
    });
    expect(wallet.balanceKobo).toBe(60000);
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WalletLedgerType.TopUpConfirmed,
        amountKobo: 50000,
        balanceBeforeKobo: 10000,
        balanceAfterKobo: 60000,
      }),
    );
  });

  it('returns already processed for confirmed top-ups', async () => {
    const topUp = {
      status: TopUpStatus.Confirmed,
      providerReference: 'reference-id',
    };
    const manager = createManager({ topUp });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(
      service.confirmTopUpByReference('reference-id', { status: 'SUCCESS' }),
    ).resolves.toEqual({ topUp, alreadyProcessed: true });
  });

  it('requires an existing top-up before confirming', async () => {
    const manager = createManager({ topUp: null });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(
      service.confirmTopUpByReference('missing-reference', {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function createManager(input?: {
  wallet?: Record<string, unknown>;
  topUp?: Record<string, unknown> | null;
}) {
  const walletRepository = {
    findOneBy: jest.fn().mockResolvedValue(input?.wallet ?? null),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      id: 'wallet-id',
      currency: 'NGN',
      balanceKobo: 0,
      heldKobo: 0,
      ...value,
    })),
  };

  return {
    getRepository: jest.fn().mockReturnValue(walletRepository),
    create: jest.fn((_entity, value) => value),
    save: jest.fn(async (value) => value),
    findOne: jest.fn((entity) => {
      if (entity === WalletTopUp) {
        return Promise.resolve(input?.topUp ?? null);
      }

      if (entity === Wallet) {
        return Promise.resolve(input?.wallet ?? null);
      }

      return Promise.resolve(null);
    }),
  };
}
