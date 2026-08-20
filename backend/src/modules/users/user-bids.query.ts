import type { Repository, SelectQueryBuilder } from 'typeorm';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { UserBidStatus } from '../../common/enums/user-bid-status.enum';
import { Auction } from '../auctions/entities/auction.entity';
import type { Bid } from '../bids/entities/bid.entity';
import type { ListUserBidsQueryDto } from './dto/list-user-bids-query.dto';

interface UserBidPageRow {
  auctionId: string;
  bidAmountKobo: string;
  lastBidAt: Date;
}

const wonStatuses = [AuctionStatus.Settled, AuctionStatus.AwaitingPayment];

function applyStatusFilter(
  queryBuilder: SelectQueryBuilder<Bid>,
  userId: string,
  status?: UserBidStatus,
) {
  if (status === UserBidStatus.Won) {
    queryBuilder.andWhere(
      'auction.status IN (:...wonStatuses) AND auction.winnerId = :winnerId',
      { wonStatuses, winnerId: userId },
    );
  } else if (status === UserBidStatus.Active) {
    queryBuilder.andWhere('auction.status = :liveStatus', {
      liveStatus: AuctionStatus.Live,
    });
  } else if (status === UserBidStatus.Past) {
    queryBuilder.andWhere(
      `auction.status <> :liveStatus
       AND NOT (auction.status IN (:...wonStatuses) AND auction.winnerId = :winnerId)`,
      { liveStatus: AuctionStatus.Live, wonStatuses, winnerId: userId },
    );
  }

  return queryBuilder;
}

export async function queryUserBidCounts(
  bidsRepository: Repository<Bid>,
  userId: string,
) {
  const result = await bidsRepository
    .createQueryBuilder('bid')
    .innerJoin(Auction, 'auction', 'auction.id = bid.auctionId')
    .where('bid.bidderId = :userId', { userId })
    .select(
      'COUNT(DISTINCT CASE WHEN auction.status = :liveStatus THEN bid.auctionId END)',
      'active',
    )
    .addSelect(
      `COUNT(DISTINCT CASE WHEN auction.status <> :liveStatus
       AND NOT (auction.status IN (:...wonStatuses) AND auction.winnerId = :winnerId)
       THEN bid.auctionId END)`,
      'past',
    )
    .addSelect(
      `COUNT(DISTINCT CASE WHEN auction.status IN (:...wonStatuses)
       AND auction.winnerId = :winnerId THEN bid.auctionId END)`,
      'won',
    )
    .setParameters({
      liveStatus: AuctionStatus.Live,
      wonStatuses,
      winnerId: userId,
    })
    .getRawOne<{ active: string; past: string; won: string }>();

  return {
    active: Number(result?.active ?? 0),
    past: Number(result?.past ?? 0),
    won: Number(result?.won ?? 0),
  };
}

export async function queryUserBidPage(
  bidsRepository: Repository<Bid>,
  userId: string,
  query: ListUserBidsQueryDto,
) {
  const baseQuery = bidsRepository
    .createQueryBuilder('bid')
    .innerJoin(Auction, 'auction', 'auction.id = bid.auctionId')
    .where('bid.bidderId = :userId', { userId });
  applyStatusFilter(baseQuery, userId, query.status);

  const countResult = await baseQuery
    .clone()
    .select('COUNT(DISTINCT bid.auctionId)', 'total')
    .getRawOne<{ total: string }>();

  const rows = await baseQuery
    .clone()
    .select('bid.auctionId', 'auctionId')
    .addSelect('MAX(bid.amountKobo)', 'bidAmountKobo')
    .addSelect('MAX(bid.createdAt)', 'lastBidAt')
    .groupBy('bid.auctionId')
    .orderBy('MAX(bid.createdAt)', 'DESC')
    .limit(query.limit)
    .offset(query.offset)
    .getRawMany<UserBidPageRow>();

  return {
    rows: rows.map((row) => ({
      auctionId: row.auctionId,
      bidAmountKobo: Number(row.bidAmountKobo),
    })),
    total: Number(countResult?.total ?? 0),
  };
}
