import { BadRequestException } from '@nestjs/common';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { BidStatus } from '../../common/enums/bid-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { WalletLedgerType } from '../../common/enums/wallet-ledger-type.enum';
import type { NotificationsService } from '../notifications/notifications.service';
import { Wallet } from '../wallets/entities/wallet.entity';
import { Bid } from '../bids/entities/bid.entity';
import { AuctionSettlementService } from './auction-settlement.service';

describe('AuctionSettlementService', () => {
  let dataSource: { transaction: jest.Mock };
  let auctionsRepository: { findOneBy: jest.Mock };
  let bidsRepository: { findOneBy: jest.Mock };
  let paymentAccountsRepository: { findOneBy: jest.Mock };
  let deliveryRepository: { findOneBy: jest.Mock; save: jest.Mock };
  let notificationsService: { create: jest.Mock };
  let service: AuctionSettlementService;

  beforeEach(() => {
    dataSource = { transaction: jest.fn((callback) => callback(createManager())) };
    auctionsRepository = { findOneBy: jest.fn() };
    bidsRepository = { findOneBy: jest.fn() };
    paymentAccountsRepository = { findOneBy: jest.fn() };
    deliveryRepository = { findOneBy: jest.fn(), save: jest.fn() };
    notificationsService = { create: jest.fn() };
    service = new AuctionSettlementService(
      dataSource as never,
      auctionsRepository as never,
      bidsRepository as never,
      paymentAccountsRepository as never,
      deliveryRepository as never,
      notificationsService as unknown as NotificationsService,
    );
  });

  it('returns payment instructions to the winning bidder', async () => {
    const auction = createAuction({
      status: AuctionStatus.AwaitingPayment,
      winnerId: 'winner-id',
      currentWinningBidId: 'winning-bid-id',
      paymentDeadlineAt: new Date('2026-04-25T15:00:00.000Z'),
    });
    auctionsRepository.findOneBy.mockResolvedValue(auction);
    bidsRepository.findOneBy.mockResolvedValue(
      createBid({ id: 'winning-bid-id', amountKobo: 7000000 }),
    );
    paymentAccountsRepository.findOneBy.mockResolvedValue({
      bankName: 'Providus Bank',
      accountNumber: '3635734512',
      accountName: 'KcPele Auctions',
    });

    await expect(
      service.getPaymentInstructions(
        {
          id: 'winner-id',
          role: UserRole.IndividualBidder,
          authRole: 'user',
          sessionId: 'session-id',
        },
        auction.id,
      ),
    ).resolves.toEqual({
      auction: expect.objectContaining({ id: auction.id }),
      winningBid: { id: 'winning-bid-id', amountKobo: 7000000 },
      paymentDeadlineAt: auction.paymentDeadlineAt,
      paymentAccount: {
        bankName: 'Providus Bank',
        accountNumber: '3635734512',
        accountName: 'KcPele Auctions',
      },
    });
  });

  it('settles an auction payment with external and wallet amounts', async () => {
    const auction = createAuction({
      status: AuctionStatus.AwaitingPayment,
      winnerId: 'winner-id',
      currentWinningBidId: 'winning-bid-id',
    });
    const winningBid = createBid({
      id: 'winning-bid-id',
      bidderId: 'winner-id',
      amountKobo: 7000000,
    });
    const wallet = createWallet({ userId: 'winner-id', balanceKobo: 2000000 });
    const manager = createManager({ auction, bids: [winningBid], wallet });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(
      service.settleAuctionPayment('admin-id', auction.id, {
        externalPaymentKobo: 6000000,
        walletPaymentKobo: 1000000,
      }),
    ).resolves.toEqual({
      auction: expect.objectContaining({
        status: AuctionStatus.Settled,
        externalPaymentKobo: 6000000,
        walletPaymentKobo: 1000000,
      }),
      winningBid,
    });
    expect(wallet.balanceKobo).toBe(1000000);
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WalletLedgerType.FinalPaymentConfirmed,
        amountKobo: -1000000,
      }),
    );
  });

  it('rejects settlement below the winning bid amount', async () => {
    const auction = createAuction({
      status: AuctionStatus.AwaitingPayment,
      winnerId: 'winner-id',
      currentWinningBidId: 'winning-bid-id',
    });
    const winningBid = createBid({
      id: 'winning-bid-id',
      bidderId: 'winner-id',
      amountKobo: 7000000,
    });
    const manager = createManager({ auction, bids: [winningBid] });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(
      service.settleAuctionPayment('admin-id', auction.id, {
        externalPaymentKobo: 6000000,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('defaults unpaid auctions after the payment deadline', async () => {
    const auction = createAuction({
      status: AuctionStatus.AwaitingPayment,
      winnerId: 'winner-id',
      paymentDeadlineAt: new Date(Date.now() - 60_000),
    });
    const manager = createManager({ auction });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(
      service.defaultAuctionPayment(auction.id, { reason: 'Not paid' }),
    ).resolves.toEqual({
      auction: expect.objectContaining({
        status: AuctionStatus.Defaulted,
        defaultReason: 'Not paid',
      }),
      changed: true,
    });
  });
});

function createAuction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'auction-id',
    category: ListingCategory.Car,
    listingId: 'listing-id',
    sellerId: 'seller-id',
    basePriceKobo: 5000000,
    minimumBidIncrementKobo: 100000,
    holdPercent: 10,
    sellerFeeBps: 300,
    buyerFeeBps: 0,
    startTime: new Date('2026-04-24T13:00:00.000Z'),
    durationMinutes: 120,
    endTime: new Date('2026-04-24T15:00:00.000Z'),
    status: AuctionStatus.Scheduled,
    currentWinningBidId: null,
    winnerId: null,
    paymentDeadlineAt: null,
    externalPaymentKobo: null,
    walletPaymentKobo: null,
    settledById: null,
    settledAt: null,
    defaultedAt: null,
    defaultReason: null,
    cancelledById: null,
    cancellationReason: null,
    cancelledAt: null,
    createdAt: new Date('2026-04-24T12:00:00.000Z'),
    updatedAt: new Date('2026-04-24T12:00:00.000Z'),
    ...overrides,
  };
}

function createBid(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bid-id',
    auctionId: 'auction-id',
    bidderId: 'bidder-id',
    amountKobo: 5000000,
    walletHoldId: 'hold-id',
    status: BidStatus.Accepted,
    createdAt: new Date('2026-04-24T14:00:00.000Z'),
    ...overrides,
  };
}

function createWallet(overrides: Record<string, unknown> = {}) {
  return {
    id: 'wallet-id',
    userId: 'winner-id',
    currency: 'NGN',
    balanceKobo: 0,
    heldKobo: 0,
    ...overrides,
  };
}

function createManager(input?: {
  auction?: ReturnType<typeof createAuction>;
  bids?: ReturnType<typeof createBid>[];
  wallet?: ReturnType<typeof createWallet> | null;
}) {
  return {
    findOne: jest.fn((entity) => {
      if (entity.name === 'Auction') {
        return Promise.resolve(input?.auction ?? createAuction());
      }

      if (entity === Bid || entity.name === 'Bid') {
        return Promise.resolve(input?.bids?.[0] ?? null);
      }

      if (entity === Wallet || entity.name === 'Wallet') {
        return Promise.resolve(input?.wallet ?? null);
      }

      return Promise.resolve(null);
    }),
    create: jest.fn((_entity, value) => value),
    save: jest.fn(async (value) => value),
  };
}
