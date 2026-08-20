import { ListingCategory } from '../../common/enums/listing-category.enum';
import { AuctionCatalogQuery } from './auction-catalog.query';
import {
  createAuction,
  createBidStatsQueryBuilder,
  createListQueryBuilder,
} from './auctions.service.spec-helpers';

describe('AuctionCatalogQuery', () => {
  it('returns an empty page when search matches no listing', async () => {
    const searchBuilder = () => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    });
    const auctions = { find: jest.fn() };
    const query = new AuctionCatalogQuery(
      auctions as never,
      {} as never,
      { createQueryBuilder: jest.fn(searchBuilder) } as never,
      { createQueryBuilder: jest.fn(searchBuilder) } as never,
      {} as never,
    );

    await expect(
      query.list({ search: 'missing', limit: 20, offset: 0 }),
    ).resolves.toEqual({ auctions: [], total: 0 });
    expect(auctions.find).not.toHaveBeenCalled();
  });

  it('applies a car year filter and hydrates the listing title', async () => {
    const auction = createAuction({ category: ListingCategory.Car });
    const listBuilder = createListQueryBuilder();
    listBuilder.getManyAndCount.mockResolvedValue([[auction], 1]);
    const yearBuilder = {
      select: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: auction.listingId }]),
    };
    const auctions = {
      find: jest.fn().mockResolvedValue([{ id: auction.id }]),
      createQueryBuilder: jest.fn().mockReturnValue(listBuilder),
    };
    const cars = {
      createQueryBuilder: jest.fn().mockReturnValue(yearBuilder),
      find: jest.fn().mockResolvedValue([
        {
          id: auction.listingId,
          year: 2024,
          make: 'Toyota',
          model: 'Camry',
          condition: 'Verified',
          mileage: 12000,
          photoUrls: ['car.jpg'],
        },
      ]),
    };
    const query = new AuctionCatalogQuery(
      auctions as never,
      { createQueryBuilder: jest.fn(createBidStatsQueryBuilder) } as never,
      cars as never,
      { find: jest.fn().mockResolvedValue([]) } as never,
      {} as never,
    );

    await expect(
      query.list({ minYear: 2020, limit: 20, offset: 0 }),
    ).resolves.toEqual(
      expect.objectContaining({
        total: 1,
        auctions: [expect.objectContaining({ title: '2024 Toyota Camry' })],
      }),
    );
    expect(yearBuilder.andWhere).toHaveBeenCalledWith('c.year >= :minY', {
      minY: 2020,
    });
  });
});
