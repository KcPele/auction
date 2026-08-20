import type { Repository, SelectQueryBuilder } from 'typeorm';
import { UserBidStatus } from '../../common/enums/user-bid-status.enum';
import type { Bid } from '../bids/entities/bid.entity';
import { queryUserBidCounts, queryUserBidPage } from './user-bids.query';

type QueryBuilderMock = jest.Mocked<SelectQueryBuilder<Bid>>;

function fluentQueryBuilder(): QueryBuilderMock {
  const builder = {
    innerJoin: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    clone: jest.fn(),
    select: jest.fn(),
    addSelect: jest.fn(),
    groupBy: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn(),
    setParameters: jest.fn(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
  } as unknown as QueryBuilderMock;

  for (const method of [
    'innerJoin',
    'where',
    'andWhere',
    'select',
    'addSelect',
    'groupBy',
    'orderBy',
    'limit',
    'offset',
    'setParameters',
  ] as const) {
    (builder[method] as jest.Mock).mockReturnValue(builder);
  }

  return builder;
}

describe('queryUserBidPage', () => {
  it('counts distinct auctions and paginates grouped bids in SQL', async () => {
    const base = fluentQueryBuilder();
    const count = fluentQueryBuilder();
    const rows = fluentQueryBuilder();
    base.clone.mockReturnValueOnce(count).mockReturnValueOnce(rows);
    count.getRawOne.mockResolvedValue({ total: '7' });
    rows.getRawMany.mockResolvedValue([
      {
        auctionId: 'auction-1',
        bidAmountKobo: '125000',
        lastBidAt: new Date(),
      },
    ]);
    const repository = {
      createQueryBuilder: jest.fn(() => base),
    } as unknown as Repository<Bid>;

    const result = await queryUserBidPage(repository, 'user-1', {
      status: UserBidStatus.Active,
      limit: 20,
      offset: 40,
    });

    expect(base.andWhere).toHaveBeenCalledWith(
      'auction.status = :liveStatus',
      expect.objectContaining({ liveStatus: 'LIVE' }),
    );
    expect(count.select).toHaveBeenCalledWith(
      'COUNT(DISTINCT bid.auctionId)',
      'total',
    );
    expect(rows.limit).toHaveBeenCalledWith(20);
    expect(rows.offset).toHaveBeenCalledWith(40);
    expect(result).toEqual({
      rows: [{ auctionId: 'auction-1', bidAmountKobo: 125000 }],
      total: 7,
    });
  });

  it('counts active, past and won auctions in one grouped query', async () => {
    const builder = fluentQueryBuilder();
    builder.getRawOne.mockResolvedValue({ active: '2', past: '4', won: '1' });
    const repository = {
      createQueryBuilder: jest.fn(() => builder),
    } as unknown as Repository<Bid>;

    await expect(queryUserBidCounts(repository, 'user-1')).resolves.toEqual({
      active: 2,
      past: 4,
      won: 1,
    });
    expect(builder.getRawOne).toHaveBeenCalledTimes(1);
    expect(builder.setParameters).toHaveBeenCalledWith(
      expect.objectContaining({ liveStatus: 'LIVE', winnerId: 'user-1' }),
    );
  });

  it('filters past bids without treating completed wins as losses', async () => {
    const base = fluentQueryBuilder();
    const count = fluentQueryBuilder();
    const rows = fluentQueryBuilder();
    base.clone.mockReturnValueOnce(count).mockReturnValueOnce(rows);
    count.getRawOne.mockResolvedValue({ total: '0' });
    rows.getRawMany.mockResolvedValue([]);
    const repository = {
      createQueryBuilder: jest.fn(() => base),
    } as unknown as Repository<Bid>;

    await queryUserBidPage(repository, 'user-1', {
      status: UserBidStatus.Past,
      limit: 20,
      offset: 0,
    });

    expect(base.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('auction.status <> :liveStatus'),
      expect.objectContaining({ liveStatus: 'LIVE', winnerId: 'user-1' }),
    );
  });
});
