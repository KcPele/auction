import { BadRequestException } from '@nestjs/common';
import { WalletHoldStatus } from '../../common/enums/wallet-hold-status.enum';
import { WalletLedgerType } from '../../common/enums/wallet-ledger-type.enum';
import { WalletHold } from './entities/wallet-hold.entity';
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
  let service: WalletsService;

  beforeEach(() => {
    dataSource = { transaction: jest.fn((callback) => callback(createManager())) };
    walletsRepository = {
      findOneBy: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => createWallet(value)),
    };
    ledgerRepository = { find: jest.fn() };
    service = new WalletsService(
      dataSource as never,
      walletsRepository as never,
      ledgerRepository as never,
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
  });

  it('lists ledger entries for the user wallet', async () => {
    walletsRepository.findOneBy.mockResolvedValue({ id: 'wallet-id' });
    ledgerRepository.find.mockResolvedValue([{ id: 'entry-id' }]);

    await expect(
      service.listLedger('user-id', { limit: 10, offset: 5 }),
    ).resolves.toEqual({ ledgerEntries: [{ id: 'entry-id' }] });
  });

  it('creates bid holds against available balance', async () => {
    const wallet = createWallet({ balanceKobo: 100000 });
    const manager = createManager({ wallet });

    await expect(
      service.createBidHold(manager as never, {
        userId: 'user-id',
        auctionId: 'auction-id',
        amountKobo: 50000,
        reference: 'bid-reference',
        metadata: {},
      }),
    ).resolves.toEqual({
      wallet: expect.objectContaining({ heldKobo: 50000 }),
      hold: expect.objectContaining({ amountKobo: 50000 }),
    });
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WalletLedgerType.BidHoldCreated,
        amountKobo: 50000,
      }),
    );
  });

  it('rejects bid holds above available balance', async () => {
    const manager = createManager({
      wallet: createWallet({ balanceKobo: 10000, heldKobo: 5000 }),
    });

    await expect(
      service.createBidHold(manager as never, {
        userId: 'user-id',
        auctionId: 'auction-id',
        amountKobo: 6000,
        reference: 'bid-reference',
        metadata: {},
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('releases active bid holds', async () => {
    const wallet = createWallet({ balanceKobo: 100000, heldKobo: 50000 });
    const hold = {
      id: 'hold-id',
      walletId: wallet.id,
      amountKobo: 50000,
      status: WalletHoldStatus.Active,
    };
    const manager = createManager({ wallet, hold });

    await expect(
      service.releaseBidHold(manager as never, {
        holdId: 'hold-id',
        reference: 'release-reference',
        metadata: {},
      }),
    ).resolves.toEqual({
      hold: expect.objectContaining({ status: WalletHoldStatus.Released }),
      released: true,
    });
    expect(wallet.heldKobo).toBe(0);
  });
});

function createWallet(overrides: Record<string, unknown> = {}) {
  return {
    id: 'wallet-id',
    userId: 'user-id',
    currency: 'NGN',
    balanceKobo: 0,
    heldKobo: 0,
    createdAt: new Date('2026-04-24T12:00:00.000Z'),
    updatedAt: new Date('2026-04-24T12:00:00.000Z'),
    ...overrides,
  };
}

function createManager(input?: {
  wallet?: Record<string, unknown>;
  hold?: Record<string, unknown> | null;
}) {
  return {
    getRepository: jest.fn().mockReturnValue({
      findOneBy: jest.fn().mockResolvedValue(input?.wallet ?? null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => createWallet(value)),
    }),
    create: jest.fn((_entity, value) => value),
    update: jest.fn(),
    save: jest.fn(async (value) => {
      if ('auctionId' in value && 'amountKobo' in value) {
        return { id: 'hold-id', status: WalletHoldStatus.Active, ...value };
      }

      return value;
    }),
    findOne: jest.fn((entity) => {
      if (entity === Wallet) {
        return Promise.resolve(input?.wallet ?? null);
      }

      if (entity === WalletHold) {
        return Promise.resolve(input?.hold ?? null);
      }

      return Promise.resolve(null);
    }),
  };
}
