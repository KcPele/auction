import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DefaultPlatformFees } from '../../common/constants/platform-fees';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { ListingStatus } from '../../common/enums/listing-status.enum';
import { AuctionsService } from './auctions.service';

describe('AuctionsService', () => {
  let auctionsRepository: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  };
  let bidsRepository: { find: jest.Mock };
  let carListingsRepository: { findOneBy: jest.Mock };
  let gadgetListingsRepository: { findOneBy: jest.Mock };
  let feesRepository: { findOneBy: jest.Mock };
  let service: AuctionsService;

  beforeEach(() => {
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
    bidsRepository = { find: jest.fn() };
    carListingsRepository = { findOneBy: jest.fn() };
    gadgetListingsRepository = { findOneBy: jest.fn() };
    feesRepository = { findOneBy: jest.fn() };
    service = new AuctionsService(
      auctionsRepository as never,
      bidsRepository as never,
      carListingsRepository as never,
      gadgetListingsRepository as never,
      feesRepository as never,
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
        endTime: new Date('2026-04-24T15:00:00.000Z'),
      }),
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
    bidsRepository.find.mockResolvedValue([{ id: 'bid-id' }]);

    await expect(service.listBids('auction-id')).resolves.toEqual({
      bids: [{ id: 'bid-id' }],
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
    cancelledById: null,
    cancellationReason: null,
    cancelledAt: null,
    createdAt: new Date('2026-04-24T12:00:00.000Z'),
    updatedAt: new Date('2026-04-24T12:00:00.000Z'),
    ...overrides,
  };
}
