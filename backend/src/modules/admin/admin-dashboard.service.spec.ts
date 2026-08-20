import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardService auction monitor', () => {
  const bidStatsQuery = {
    select: jest.fn(),
    addSelect: jest.fn(),
    where: jest.fn(),
    groupBy: jest.fn(),
    getRawMany: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    bidStatsQuery.select.mockReturnValue(bidStatsQuery);
    bidStatsQuery.addSelect.mockReturnValue(bidStatsQuery);
    bidStatsQuery.where.mockReturnValue(bidStatsQuery);
    bidStatsQuery.groupBy.mockReturnValue(bidStatsQuery);
  });

  function createService(auctionsRepository: Record<string, jest.Mock>) {
    const bidsRepository = {
      createQueryBuilder: jest.fn(() => bidStatsQuery),
    };
    const carListingsRepository = { find: jest.fn() };
    const gadgetListingsRepository = { find: jest.fn() };
    const notificationsRepository = {
      findAndCount: jest.fn(),
    };
    const usersRepository = { find: jest.fn() };
    const deliveryLogsRepository = { findAndCount: jest.fn() };
    const service = new AdminDashboardService(
      auctionsRepository as never,
      bidsRepository as never,
      carListingsRepository as never,
      gadgetListingsRepository as never,
      {} as never,
      notificationsRepository as never,
      usersRepository as never,
      deliveryLogsRepository as never,
      {} as never,
    );
    return {
      service,
      carListingsRepository,
      gadgetListingsRepository,
      notificationsRepository,
      usersRepository,
      deliveryLogsRepository,
    };
  }

  it('counts distinct bidders and keeps listing titles consistent', async () => {
    const auction = {
      id: 'auction-id',
      listingId: 'listing-id',
      category: ListingCategory.Car,
      status: AuctionStatus.Settled,
      basePriceKobo: 1_000,
      holdPercent: 15,
      endTime: new Date(),
    };
    const auctionsRepository = {
      findAndCount: jest.fn().mockResolvedValue([[auction], 3]),
    };
    const { service, carListingsRepository, gadgetListingsRepository } =
      createService(auctionsRepository);
    carListingsRepository.find.mockResolvedValue([
      { id: 'listing-id', year: 2022, make: 'Toyota', model: 'Camry' },
    ]);
    gadgetListingsRepository.find.mockResolvedValue([]);
    bidStatsQuery.getRawMany.mockResolvedValue([
      {
        auctionId: 'auction-id',
        bidderCount: '2',
        currentBidKobo: '1400',
      },
    ]);

    const result = await service.listAdminAuctions({ limit: 50, offset: 0 });

    expect(result.total).toBe(3);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        title: '2022 Toyota Camry',
        bidderCount: 2,
        currentBidKobo: 1_400,
      }),
    );
  });

  it('preserves the total when the requested page has no rows', async () => {
    const auctionsRepository = {
      findAndCount: jest.fn().mockResolvedValue([[], 3]),
    };
    const { service } = createService(auctionsRepository);

    await expect(
      service.listAdminAuctions({ limit: 50, offset: 100 }),
    ).resolves.toEqual({ items: [], total: 3 });
  });

  it('queries an exact auction id for admin search results', async () => {
    const auctionsRepository = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    const { service } = createService(auctionsRepository);

    await service.listAdminAuctions({
      auctionId: '65ce2b84-7ca9-4eb4-b412-e95cbd5e0f02',
      limit: 1,
      offset: 0,
    });

    expect(auctionsRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '65ce2b84-7ca9-4eb4-b412-e95cbd5e0f02' },
      }),
    );
  });

  it('paginates filtered external notification delivery logs', async () => {
    const { service, deliveryLogsRepository } = createService({} as never);
    deliveryLogsRepository.findAndCount.mockResolvedValue([
      [{ id: 'delivery-id' }],
      38,
    ]);

    await expect(
      service.listNotificationLogs({
        channel: 'EMAIL',
        status: 'FAILED',
        limit: 20,
        offset: 20,
      }),
    ).resolves.toEqual({ items: [{ id: 'delivery-id' }], total: 38 });

    expect(deliveryLogsRepository.findAndCount).toHaveBeenCalledWith({
      where: { channel: 'EMAIL', status: 'FAILED' },
      order: { createdAt: 'DESC' },
      take: 20,
      skip: 20,
    });
  });

  it('paginates in-app notifications and preserves the total', async () => {
    const { service, notificationsRepository } = createService({} as never);
    notificationsRepository.findAndCount.mockResolvedValue([
      [
        {
          id: 'notification-id',
          audience: 'ADMIN',
          recipientId: null,
          type: 'SYSTEM',
          title: 'System update',
          message: 'All systems operational',
          createdAt: new Date('2026-08-20T12:00:00.000Z'),
        },
      ],
      64,
    ]);

    const result = await service.listInAppNotifications({
      limit: 25,
      offset: 25,
    });

    expect(result.total).toBe(64);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        id: 'notification-id',
        recipient: 'All admins',
      }),
    );
    expect(notificationsRepository.findAndCount).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
      take: 25,
      skip: 25,
    });
  });
});
