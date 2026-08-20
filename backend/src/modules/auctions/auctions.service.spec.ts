import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DefaultPlatformFees } from '../../common/constants/platform-fees';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { BidStatus } from '../../common/enums/bid-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import type { NotificationsService } from '../notifications/notifications.service';
import type { BidsGateway } from '../bids/bids.gateway';
import type { AuctionLifecycleScheduler } from './auction-lifecycle.scheduler';
import { AuctionsService } from './auctions.service';
import { AuctionCatalogQuery } from './auction-catalog.query';
import type { WalletsService } from '../wallets/wallets.service';
import {
  createAuction,
  createBid,
  createBidStatsQueryBuilder,
  createListQueryBuilder,
  createListing,
  createManager,
} from './auctions.service.spec-helpers';

describe('AuctionsService', () => {
  let dataSource: { transaction: jest.Mock };
  let auctionsRepository: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let bidsRepository: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let carListingsRepository: { findOneBy: jest.Mock; find: jest.Mock };
  let gadgetListingsRepository: { findOneBy: jest.Mock; find: jest.Mock };
  let feesRepository: { findOneBy: jest.Mock };
  let biddingSettingsRepository: { findOneBy: jest.Mock };
  let escrowSettingsRepository: { findOneBy: jest.Mock };
  let usersRepository: { find: jest.Mock; findOneBy: jest.Mock };
  let notificationsService: { create: jest.Mock };
  let walletsService: { releaseBidHold: jest.Mock };
  let bidsGateway: { emitStatusChanged: jest.Mock; emitAuctionClosed: jest.Mock };
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
      createQueryBuilder: jest.fn(() => createListQueryBuilder()),
    };
    bidsRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(() => createBidStatsQueryBuilder()),
    };
    carListingsRepository = { findOneBy: jest.fn(), find: jest.fn().mockResolvedValue([]) };
    gadgetListingsRepository = { findOneBy: jest.fn(), find: jest.fn().mockResolvedValue([]) };
    feesRepository = { findOneBy: jest.fn() };
    biddingSettingsRepository = { findOneBy: jest.fn() };
    escrowSettingsRepository = { findOneBy: jest.fn().mockResolvedValue(null) };
    usersRepository = { find: jest.fn(), findOneBy: jest.fn() };
    notificationsService = { create: jest.fn() };
    walletsService = { releaseBidHold: jest.fn() };
    bidsGateway = { emitStatusChanged: jest.fn(), emitAuctionClosed: jest.fn() };
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
      escrowSettingsRepository as never,
      new AuctionCatalogQuery(
        auctionsRepository as never,
        bidsRepository as never,
        carListingsRepository as never,
        gadgetListingsRepository as never,
        usersRepository as never,
      ),
      notificationsService as unknown as NotificationsService,
      lifecycleScheduler as unknown as AuctionLifecycleScheduler,
      bidsGateway as unknown as BidsGateway,
      walletsService as unknown as WalletsService,
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

  it('preserves a stricter reviewed listing hold requirement', async () => {
    const listing = { ...createListing(), holdPercent: 18 };
    auctionsRepository.findOneBy.mockResolvedValue(null);
    carListingsRepository.findOneBy.mockResolvedValue(listing);
    biddingSettingsRepository.findOneBy.mockResolvedValue({
      bidRequirementPercent: 15,
    });

    await service.createFromApprovedListing(ListingCategory.Car, listing.id);

    expect(auctionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ holdPercent: 18 }),
    );
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
    auctionsRepository.createQueryBuilder.mockReturnValue(
      createListQueryBuilder([createAuction()]),
    );

    await expect(
      service.list({
        category: ListingCategory.Car,
        status: AuctionStatus.Scheduled,
        limit: 10,
        offset: 5,
      }),
    ).resolves.toEqual({
      auctions: [expect.objectContaining({ id: 'auction-id' })],
      total: 1,
    });
    expect(auctionsRepository.createQueryBuilder).toHaveBeenCalledWith('a');
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
    const manager = createManager({ auction });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

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

  it('releases the winning wallet hold when cancelling a live auction', async () => {
    const winningBid = createBid({ status: BidStatus.Winning });
    const auction = createAuction({
      status: AuctionStatus.Live,
      currentWinningBidId: winningBid.id,
    });
    const manager = createManager({ auction, bids: [winningBid] });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await service.cancel('admin-id', auction.id, { reason: 'Safety issue' });

    expect(walletsService.releaseBidHold).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({
        holdId: winningBid.walletHoldId,
        metadata: expect.objectContaining({ reason: 'auction_cancelled' }),
      }),
    );
    expect(manager.update).toHaveBeenCalledWith(
      expect.any(Function),
      { auctionId: auction.id },
      { status: BidStatus.Cancelled },
    );
  });

  it('notifies the seller and every bidder when an auction is cancelled', async () => {
    const firstBid = createBid({ bidderId: 'bidder-1' });
    const secondBid = createBid({ id: 'bid-2', bidderId: 'bidder-2' });
    const auction = createAuction({ status: AuctionStatus.Live });
    const manager = createManager({ auction, bids: [firstBid, secondBid] });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await service.cancel('admin-id', auction.id, { reason: 'Listing safety issue' });

    expect(bidsGateway.emitStatusChanged).toHaveBeenCalledWith({
      auctionId: auction.id,
      previousStatus: AuctionStatus.Live,
      newStatus: AuctionStatus.Cancelled,
    });
    for (const recipientId of [auction.sellerId, 'bidder-1', 'bidder-2']) {
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId,
          title: 'Auction cancelled',
        }),
      );
    }
  });

  it('rejects cancellation after an auction has ended', async () => {
    const manager = createManager({
      auction: createAuction({ status: AuctionStatus.Ended }),
    });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

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
    expect(bidsGateway.emitStatusChanged).toHaveBeenCalledWith(
      expect.objectContaining({ previousStatus: AuctionStatus.Live }),
    );
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: winningBid.bidderId,
        title: 'You won an auction',
      }),
    );
  });

  it('uses the configured payment window for winner deadlines', async () => {
    escrowSettingsRepository.findOneBy.mockResolvedValue({
      paymentWindowHours: 48,
    });
    const beforeClose = Date.now();
    const auction = createAuction({
      status: AuctionStatus.Live,
      startTime: new Date(beforeClose - 120_000),
      endTime: new Date(beforeClose - 60_000),
    });
    const winningBid = createBid({ amountKobo: 7000000 });
    const manager = createManager({ auction, bids: [winningBid] });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await service.closeAuction(auction.id);

    const deadline = auction.paymentDeadlineAt as Date | null;
    expect(deadline).not.toBeNull();
    expect((deadline as Date).getTime()).toBeGreaterThanOrEqual(
      beforeClose + 48 * 60 * 60_000,
    );
  });

});
