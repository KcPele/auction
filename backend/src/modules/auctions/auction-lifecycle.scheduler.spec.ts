import {
  AuctionLifecycleJobNames,
  PaymentDeadlineJobNames,
} from '../../common/constants/auction-lifecycle-jobs';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { AuctionLifecycleScheduler } from './auction-lifecycle.scheduler';
import type { Auction } from './entities/auction.entity';

describe('AuctionLifecycleScheduler', () => {
  let auctionLifecycleQueue: { add: jest.Mock };
  let paymentDeadlinesQueue: { add: jest.Mock };
  let scheduler: AuctionLifecycleScheduler;

  beforeEach(() => {
    auctionLifecycleQueue = { add: jest.fn() };
    paymentDeadlinesQueue = { add: jest.fn() };
    scheduler = new AuctionLifecycleScheduler(
      auctionLifecycleQueue as never,
      paymentDeadlinesQueue as never,
    );
  });

  it('schedules start and close jobs for scheduled auctions', async () => {
    const auction = createAuction();

    await scheduler.scheduleAuctionLifecycle(auction);

    expect(auctionLifecycleQueue.add).toHaveBeenCalledWith(
      AuctionLifecycleJobNames.Start,
      { auctionId: auction.id },
      expect.objectContaining({ jobId: `auction:${auction.id}:start` }),
    );
    expect(auctionLifecycleQueue.add).toHaveBeenCalledWith(
      AuctionLifecycleJobNames.Close,
      { auctionId: auction.id },
      expect.objectContaining({ jobId: `auction:${auction.id}:close` }),
    );
  });

  it('schedules payment deadline jobs', async () => {
    const auction = createAuction({
      paymentDeadlineAt: new Date(Date.now() + 60_000),
    });

    await scheduler.schedulePaymentDeadline(auction);

    expect(paymentDeadlinesQueue.add).toHaveBeenCalledWith(
      PaymentDeadlineJobNames.Forfeit,
      { auctionId: auction.id },
      expect.objectContaining({
        jobId: `auction:${auction.id}:payment-deadline`,
      }),
    );
  });
});

function createAuction(overrides: Partial<Auction> = {}): Auction {
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
    startTime: new Date(Date.now() + 60_000),
    durationMinutes: 120,
    endTime: new Date(Date.now() + 120_000),
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
