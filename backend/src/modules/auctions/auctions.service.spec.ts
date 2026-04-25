import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DefaultPlatformFees } from '../../common/constants/platform-fees';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { BidStatus } from '../../common/enums/bid-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { ListingStatus } from '../../common/enums/listing-status.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import type { NotificationsService } from '../notifications/notifications.service';
import type { AuctionLifecycleScheduler } from './auction-lifecycle.scheduler';
import { AuctionsService } from './auctions.service';

describe('AuctionsService', () => {
  let dataSource: { transaction: jest.Mock };
  let auctionsRepository: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  };
  let bidsRepository: { find: jest.Mock; findOneBy: jest.Mock };
  let carListingsRepository: { findOneBy: jest.Mock };
  let gadgetListingsRepository: { findOneBy: jest.Mock };
  let feesRepository: { findOneBy: jest.Mock };
  let biddingSettingsRepository: { findOneBy: jest.Mock };
  let usersRepository: { find: jest.Mock; findOneBy: jest.Mock };
  let notificationsService: { create: jest.Mock };
  let lifecycleScheduler: {
    scheduleAuctionLifecycle: jest.Mock;
    scheduleAuctionStart: jest.Mock;
    scheduleAuctionClose: jest.Mock;
    schedulePaymentDeadline: jest.Mock;
  };
  let service: AuctionsService;

  beforeEach(() => {
    dataSource = {
      transaction: jest.fn((callback) => callback(createManager())),
    };
    auctionsRepository = {
      findOneBy: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({
        id: 'auction-id',
        createdAt: new Date('2026-04-24T12:00:00.000Z'),
        updatedAt: new Date('2026-04-24T12:00:00.000Z'),
        ...value,
      })),
      find: jest.fn(),
    };
    bidsRepository = { find: jest.fn(), findOneBy: jest.fn() };
    carListingsRepository = { findOneBy: jest.fn() };
    gadgetListingsRepository = { findOneBy: jest.fn() };
    feesRepository = { findOneBy: jest.fn() };
    biddingSettingsRepository = { findOneBy: jest.fn() };
    usersRepository = { find: jest.fn(), findOneBy: jest.fn() };
    notificationsService = { create: jest.fn() };
    lifecycleScheduler = {
      scheduleAuctionLifecycle: jest.fn(),
      scheduleAuctionStart: jest.fn(),
      scheduleAuctionClose: jest.fn(),
      schedulePaymentDeadline: jest.fn(),
    };
    service = new AuctionsService(
      dataSource as never,
      auctionsRepository as never,
      bidsRepository as never,
      carListingsRepository as never,
      gadgetListingsRepository as never,
      feesRepository as never,
      biddingSettingsRepository as never,
      usersRepository as never,
      notificationsService as unknown as NotificationsService,
      lifecycleScheduler as unknown as AuctionLifecycleScheduler,
    );
  });

  it('creates a scheduled car auction from an approved listing', async () => {
    const listing = createListing();
    auctionsRepository.findOneBy.mockResolvedValue(null);
    carListingsRepository.findOneBy.mockResolvedValue(listing);
    feesRepository.findOneBy.mockResolvedValue({
      sellerFeeBps: 300,
      buyerFeeBps: 0,
    });
    biddingSettingsRepository.findOneBy.mockResolvedValue({
      bidRequirementPercent: 15,
    });

    await expect(
      service.createFromApprovedListing(ListingCategory.Car, listing.id),
    ).resolves.toEqual({
      auction: expect.objectContaining({
        id: 'auction-id',
        category: ListingCategory.Car,
        listingId: listing.id,
        sellerFeeBps: 300,
        buyerFeeBps: 0,
        status: AuctionStatus.Scheduled,
      }),
      created: true,
    });
    expect(auctionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        basePriceKobo: 5000000,
        minimumBidIncrementKobo: 100000,
        holdPercent: 15,
        endTime: new Date('2026-04-24T15:00:00.000Z'),
      }),
    );
    expect(lifecycleScheduler.scheduleAuctionLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'auction-id' }),
    );
  });

  it('returns existing auction when the listing already has one', async () => {
    const existing = createAuction();
    auctionsRepository.findOneBy.mockResolvedValue(existing);

    await expect(
      service.createFromApprovedListing(ListingCategory.Car, 'listing-id'),
    ).resolves.toEqual({
      auction: expect.objectContaining({ id: existing.id }),
      created: false,
    });
  });

  it('uses default fee settings when no custom fee exists', async () => {
    const listing = createListing();
    auctionsRepository.findOneBy.mockResolvedValue(null);
    carListingsRepository.findOneBy.mockResolvedValue(listing);
    feesRepository.findOneBy.mockResolvedValue(null);

    await service.createFromApprovedListing(ListingCategory.Car, listing.id);

    expect(auctionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining(DefaultPlatformFees[ListingCategory.Car]),
    );
  });

  it('requires an approved listing before auction creation', async () => {
    auctionsRepository.findOneBy.mockResolvedValue(null);
    carListingsRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.createFromApprovedListing(ListingCategory.Car, 'missing-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists auctions with filters and pagination', async () => {
    auctionsRepository.find.mockResolvedValue([createAuction()]);

    await expect(
      service.list({
        category: ListingCategory.Car,
        status: AuctionStatus.Scheduled,
        limit: 10,
        offset: 5,
      }),
    ).resolves.toEqual({
      auctions: [expect.objectContaining({ id: 'auction-id' })],
    });
    expect(auctionsRepository.find).toHaveBeenCalledWith({
      where: {
        category: ListingCategory.Car,
        status: AuctionStatus.Scheduled,
      },
      order: { startTime: 'ASC', createdAt: 'DESC' },
      take: 10,
      skip: 5,
    });
  });

  it('lists bids for an existing auction', async () => {
    auctionsRepository.findOneBy.mockResolvedValue(createAuction());
    bidsRepository.find.mockResolvedValue([{ id: 'bid-id', bidderId: 'bidder-id', amountKobo: 5000000, status: BidStatus.Accepted, createdAt: new Date('2026-04-24T14:00:00.000Z') }]);
    usersRepository.find.mockResolvedValue([{ id: 'bidder-id', firstName: 'Ada', lastName: 'Okafor' }]);

    await expect(service.listBids('auction-id')).resolves.toEqual({
      bids: [expect.objectContaining({ id: 'bid-id', handle: '@ada***' })],
    });
  });

  it('cancels a scheduled auction', async () => {
    const auction = createAuction();
    auctionsRepository.findOneBy.mockResolvedValue(auction);

    await expect(
      service.cancel('admin-id', auction.id, { reason: 'Issue found' }),
    ).resolves.toEqual({
      auction: expect.objectContaining({
        status: AuctionStatus.Cancelled,
        cancelledById: 'admin-id',
        cancellationReason: 'Issue found',
      }),
    });
  });

  it('rejects cancellation after an auction has ended', async () => {
    auctionsRepository.findOneBy.mockResolvedValue(
      createAuction({ status: AuctionStatus.Ended }),
    );

    await expect(
      service.cancel('admin-id', 'auction-id', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('starts a scheduled auction and notifies the seller', async () => {
    const auction = createAuction({
      startTime: new Date(Date.now() - 60_000),
      endTime: new Date(Date.now() + 60_000),
    });
    const manager = createManager({ auction });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(service.startScheduledAuction(auction.id)).resolves.toEqual({
      auction: expect.objectContaining({ status: AuctionStatus.Live }),
      changed: true,
    });
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: AuctionStatus.Live }),
    );
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: auction.sellerId,
        type: NotificationType.AuctionStarted,
      }),
    );
    expect(lifecycleScheduler.scheduleAuctionClose).toHaveBeenCalledWith(
      auction,
    );
  });

  it('closes an auction with no bids as ended', async () => {
    const auction = createAuction({
      status: AuctionStatus.Live,
      startTime: new Date(Date.now() - 120_000),
      endTime: new Date(Date.now() - 60_000),
    });
    const manager = createManager({ auction, bids: [] });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(service.closeAuction(auction.id)).resolves.toEqual({
      auction: expect.objectContaining({ status: AuctionStatus.Ended }),
      winningBid: null,
      changed: true,
    });
    expect(auction.winnerId).toBeNull();
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: auction.sellerId,
        title: 'Auction ended',
      }),
    );
    expect(lifecycleScheduler.schedulePaymentDeadline).not.toHaveBeenCalled();
  });

  it('closes an auction with a winner and marks losing bids as outbid', async () => {
    const auction = createAuction({
      status: AuctionStatus.Live,
      startTime: new Date(Date.now() - 120_000),
      endTime: new Date(Date.now() - 60_000),
    });
    const winningBid = createBid({ id: 'winning-bid-id', amountKobo: 7000000 });
    const losingBid = createBid({
      id: 'losing-bid-id',
      amountKobo: 6000000,
      walletHoldId: 'losing-hold-id',
    });
    const manager = createManager({ auction, bids: [winningBid, losingBid] });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(service.closeAuction(auction.id)).resolves.toEqual({
      auction: expect.objectContaining({
        status: AuctionStatus.AwaitingPayment,
        winnerId: winningBid.bidderId,
      }),
      winningBid,
      changed: true,
    });
    expect(losingBid.status).toBe(BidStatus.Outbid);
    expect(lifecycleScheduler.schedulePaymentDeadline).toHaveBeenCalledWith(
      auction,
    );
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: winningBid.bidderId,
        title: 'You won an auction',
      }),
    );
  });

});

function createListing() {
  return {
    id: 'listing-id',
    listerId: 'seller-id',
    basePriceKobo: '5000000',
    minimumBidIncrementKobo: '100000',
    holdPercent: 10,
    startTime: new Date('2026-04-24T13:00:00.000Z'),
    durationMinutes: 120,
    status: ListingStatus.Approved,
  };
}

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

function createManager(input?: {
  auction?: ReturnType<typeof createAuction>;
  bids?: ReturnType<typeof createBid>[];
}) {
  return {
    findOne: jest.fn((entity) => {
      if (entity.name === 'Auction') {
        return Promise.resolve(input?.auction ?? createAuction());
      }

      if (entity.name === 'Bid') {
        return Promise.resolve(input?.bids?.[0] ?? null);
      }

      return Promise.resolve(null);
    }),
    find: jest.fn((entity) => {
      if (entity.name === 'Bid') {
        return Promise.resolve(input?.bids ?? []);
      }

      return Promise.resolve([]);
    }),
    create: jest.fn((_entity, value) => value),
    save: jest.fn(async (value) => value),
  };
}
