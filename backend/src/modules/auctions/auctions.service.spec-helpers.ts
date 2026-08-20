import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { BidStatus } from '../../common/enums/bid-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { ListingStatus } from '../../common/enums/listing-status.enum';

export function createListing() {
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

export function createAuction(overrides: Record<string, unknown> = {}) {
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
    winnerPaymentConfirmedAt: null,
    winnerPaymentNote: null,
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

export function createBid(overrides: Record<string, unknown> = {}) {
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

export function createManager(input?: {
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
    find: jest.fn((entity) =>
      entity.name === 'Bid' ? Promise.resolve(input?.bids ?? []) : Promise.resolve([]),
    ),
    create: jest.fn((_entity, value) => value),
    save: jest.fn(async (value) => value),
    update: jest.fn(),
  };
}

export function createListQueryBuilder(
  items: ReturnType<typeof createAuction>[] = [],
) {
  const qb = {
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    take: jest.fn(),
    skip: jest.fn(),
    andWhere: jest.fn(),
    getManyAndCount: jest.fn().mockResolvedValue([items, items.length]),
  };
  for (const method of [
    'orderBy',
    'addOrderBy',
    'take',
    'skip',
    'andWhere',
  ] as const) {
    qb[method].mockReturnValue(qb);
  }
  return qb;
}

export function createBidStatsQueryBuilder() {
  const qb = {
    select: jest.fn(),
    addSelect: jest.fn(),
    where: jest.fn(),
    groupBy: jest.fn(),
    getRawMany: jest.fn().mockResolvedValue([]),
  };
  for (const method of [
    'select',
    'addSelect',
    'where',
    'groupBy',
  ] as const) {
    qb[method].mockReturnValue(qb);
  }
  return qb;
}
