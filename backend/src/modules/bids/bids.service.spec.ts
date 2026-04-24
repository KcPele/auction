import { BadRequestException } from '@nestjs/common';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { BidStatus } from '../../common/enums/bid-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { Auction } from '../auctions/entities/auction.entity';
import type { NotificationsService } from '../notifications/notifications.service';
import type { WalletsService } from '../wallets/wallets.service';
import type { BidsGateway } from './bids.gateway';
import { BidsService } from './bids.service';
import { Bid } from './entities/bid.entity';

describe('BidsService', () => {
  let dataSource: { transaction: jest.Mock };
  let walletsService: {
    createBidHold: jest.Mock;
    attachBidToHold: jest.Mock;
    releaseBidHold: jest.Mock;
  };
  let bidsGateway: {
    emitBidPlaced: jest.Mock;
    emitTopBidChanged: jest.Mock;
    emitOutbid: jest.Mock;
  };
  let notificationsService: { create: jest.Mock };
  let service: BidsService;

  beforeEach(() => {
    dataSource = { transaction: jest.fn((callback) => callback(createManager())) };
    walletsService = {
      createBidHold: jest.fn().mockResolvedValue({
        hold: { id: 'hold-id', amountKobo: 25000000 },
      }),
      attachBidToHold: jest.fn(),
      releaseBidHold: jest.fn(),
    };
    bidsGateway = {
      emitBidPlaced: jest.fn(),
      emitTopBidChanged: jest.fn(),
      emitOutbid: jest.fn(),
    };
    notificationsService = { create: jest.fn() };
    service = new BidsService(
      dataSource as never,
      {} as never,
      {} as never,
      walletsService as unknown as WalletsService,
      bidsGateway as unknown as BidsGateway,
      notificationsService as unknown as NotificationsService,
    );
  });

  it('accepts the first live auction bid and makes it top bid', async () => {
    const auction = createAuction();
    const manager = createManager({ auction, currentTopBid: null });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(
      service.placeBid('bidder-id', auction.id, { amountKobo: 250000000 }),
    ).resolves.toEqual({
      bid: expect.objectContaining({
        id: 'bid-id',
        status: BidStatus.Winning,
        amountKobo: 250000000,
      }),
      walletHold: { id: 'hold-id', amountKobo: 25000000 },
      auction: expect.objectContaining({ currentWinningBidId: 'bid-id' }),
      isTopBid: true,
    });
    expect(walletsService.createBidHold).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({
        userId: 'bidder-id',
        amountKobo: 25000000,
      }),
    );
    expect(walletsService.attachBidToHold).toHaveBeenCalledWith(
      manager,
      'hold-id',
      'bid-id',
    );
    expect(bidsGateway.emitBidPlaced).toHaveBeenCalledWith({
      auctionId: auction.id,
      bid: expect.objectContaining({ id: 'bid-id' }),
      isTopBid: true,
    });
    expect(bidsGateway.emitTopBidChanged).toHaveBeenCalledWith({
      auctionId: auction.id,
      bid: expect.objectContaining({ id: 'bid-id' }),
      previousBid: null,
    });
  });

  it('rejects bids when the auction is not live', async () => {
    const manager = createManager({
      auction: createAuction({ status: AuctionStatus.Scheduled }),
    });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(
      service.placeBid('bidder-id', 'auction-id', { amountKobo: 250000000 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('enforces car minimum increment against the current top bid', async () => {
    const manager = createManager({
      auction: createAuction(),
      currentTopBid: createBid({ amountKobo: 250000000 }),
    });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(
      service.placeBid('bidder-id', 'auction-id', { amountKobo: 254999999 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts gadget bids below the current top without replacing it', async () => {
    const currentTopBid = createBid({ amountKobo: 260000000 });
    const auction = createAuction({
      category: ListingCategory.Gadget,
      currentWinningBidId: currentTopBid.id,
    });
    const manager = createManager({ auction, currentTopBid });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(
      service.placeBid('bidder-id', auction.id, { amountKobo: 255000000 }),
    ).resolves.toEqual(
      expect.objectContaining({
        bid: expect.objectContaining({ status: BidStatus.Accepted }),
        isTopBid: false,
      }),
    );
    expect(walletsService.releaseBidHold).not.toHaveBeenCalled();
    expect(auction.currentWinningBidId).toBe(currentTopBid.id);
    expect(bidsGateway.emitBidPlaced).toHaveBeenCalledWith({
      auctionId: auction.id,
      bid: expect.objectContaining({ status: BidStatus.Accepted }),
      isTopBid: false,
    });
    expect(bidsGateway.emitTopBidChanged).not.toHaveBeenCalled();
  });

  it('releases the previous top hold when a new top bid is accepted', async () => {
    const previousTopBid = createBid({
      id: 'previous-bid-id',
      amountKobo: 250000000,
      walletHoldId: 'previous-hold-id',
    });
    const auction = createAuction({ currentWinningBidId: previousTopBid.id });
    const manager = createManager({ auction, currentTopBid: previousTopBid });
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await service.placeBid('bidder-id', auction.id, { amountKobo: 255000000 });

    expect(previousTopBid.status).toBe(BidStatus.Outbid);
    expect(walletsService.releaseBidHold).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({
        holdId: 'previous-hold-id',
      }),
    );
    expect(auction.currentWinningBidId).toBe('bid-id');
    expect(bidsGateway.emitOutbid).toHaveBeenCalledWith({
      userId: previousTopBid.bidderId,
      auctionId: auction.id,
      bid: previousTopBid,
      newTopBid: expect.objectContaining({ id: 'bid-id' }),
    });
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: previousTopBid.bidderId,
        title: 'You have been outbid',
      }),
    );
  });
});

function createManager(input?: { auction?: Auction; currentTopBid?: Bid | null }) {
  return {
    findOne: jest.fn((entity) => {
      if (entity === Auction) {
        return Promise.resolve(input?.auction ?? createAuction());
      }

      if (entity === Bid) {
        return Promise.resolve(input?.currentTopBid ?? null);
      }

      return Promise.resolve(null);
    }),
    create: jest.fn((_entity, value) => value),
    save: jest.fn(async (value) => {
      if ('auctionId' in value && 'bidderId' in value) {
        return {
          id: 'bid-id',
          createdAt: new Date('2026-04-24T12:00:00.000Z'),
          ...value,
        };
      }

      return value;
    }),
  };
}

function createAuction(overrides: Partial<Auction> = {}): Auction {
  return {
    id: 'auction-id',
    category: ListingCategory.Car,
    listingId: 'listing-id',
    sellerId: 'seller-id',
    basePriceKobo: 250000000,
    minimumBidIncrementKobo: 5000000,
    holdPercent: 10,
    sellerFeeBps: 300,
    buyerFeeBps: 0,
    startTime: new Date('2026-04-24T12:00:00.000Z'),
    durationMinutes: 120,
    endTime: new Date(Date.now() + 60_000),
    status: AuctionStatus.Live,
    currentWinningBidId: null,
    winnerId: null,
    paymentDeadlineAt: null,
    cancelledById: null,
    cancellationReason: null,
    cancelledAt: null,
    createdAt: new Date('2026-04-24T12:00:00.000Z'),
    updatedAt: new Date('2026-04-24T12:00:00.000Z'),
    ...overrides,
  };
}

function createBid(overrides: Partial<Bid> = {}): Bid {
  return {
    id: 'top-bid-id',
    auctionId: 'auction-id',
    auction: createAuction(),
    bidderId: 'top-bidder-id',
    amountKobo: 250000000,
    walletHoldId: 'top-hold-id',
    status: BidStatus.Winning,
    createdAt: new Date('2026-04-24T12:00:00.000Z'),
    ...overrides,
  };
}
