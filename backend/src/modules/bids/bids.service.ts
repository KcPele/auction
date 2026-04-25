import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { BidStatus } from '../../common/enums/bid-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { NotificationAudience } from '../../common/enums/notification-audience.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { Auction } from '../auctions/entities/auction.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletsService } from '../wallets/wallets.service';
import { BidsGateway } from './bids.gateway';
import { PlaceBidDto } from './dto/place-bid.dto';
import { Bid } from './entities/bid.entity';
import { presentBid } from './presenters/bid.presenter';

@Injectable()
export class BidsService {
  private readonly logger = new Logger(BidsService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Auction)
    private readonly auctionsRepository: Repository<Auction>,
    @InjectRepository(Bid)
    private readonly bidsRepository: Repository<Bid>,
    private readonly walletsService: WalletsService,
    private readonly bidsGateway: BidsGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async placeBid(userId: string, auctionId: string, dto: PlaceBidDto) {
    const result = await this.dataSource.transaction(async (manager) => {
      const auction = await this.findAuctionForUpdate(manager, auctionId);

      this.assertCanBid(auction, userId, dto.amountKobo);

      const currentTopBid = await this.findCurrentTopBid(manager, auction);
      const becomesTopBid = this.validateBidAgainstTop(
        auction,
        currentTopBid,
        dto.amountKobo,
      );
      const requiredBalanceKobo = this.calculateRequiredBalance(
        auction.basePriceKobo,
        auction.holdPercent,
      );
      await this.walletsService.assertBidQualification(manager, {
        userId,
        requiredBalanceKobo,
      });
      const bid = await manager.save(
        manager.create(Bid, {
          auctionId: auction.id,
          bidderId: userId,
          amountKobo: dto.amountKobo,
          walletHoldId: null,
          status: becomesTopBid ? BidStatus.Winning : BidStatus.Accepted,
        }),
      );

      if (becomesTopBid) {
        await this.replaceTopBid(manager, auction, currentTopBid, bid);
      }

      return {
        response: {
          bid: presentBid(bid),
          bidRequirement: {
            percent: auction.holdPercent,
            requiredBalanceKobo,
          },
          auction,
          isTopBid: becomesTopBid,
        },
        events: {
          auctionId: auction.id,
          bid,
          isTopBid: becomesTopBid,
          previousTopBid: becomesTopBid ? currentTopBid : null,
        },
      };
    });

    await this.publishBidEvents(result.events);

    return result.response;
  }

  private async findAuctionForUpdate(
    manager: EntityManager,
    auctionId: string,
  ) {
    const auction = await manager.findOne(Auction, {
      where: { id: auctionId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    return auction;
  }

  private assertCanBid(auction: Auction, userId: string, amountKobo: number) {
    if (auction.status !== AuctionStatus.Live) {
      throw new BadRequestException('Auction is not live');
    }

    if (auction.endTime.getTime() <= Date.now()) {
      throw new BadRequestException('Auction has ended');
    }

    if (auction.sellerId === userId) {
      throw new BadRequestException('Seller cannot bid on their own auction');
    }

    if (amountKobo < auction.basePriceKobo) {
      throw new BadRequestException('Bid is below the auction base price');
    }
  }

  private async findCurrentTopBid(manager: EntityManager, auction: Auction) {
    if (auction.currentWinningBidId) {
      return manager.findOne(Bid, {
        where: { id: auction.currentWinningBidId },
        lock: { mode: 'pessimistic_write' },
      });
    }

    return manager.findOne(Bid, {
      where: { auctionId: auction.id },
      order: { amountKobo: 'DESC', createdAt: 'ASC' },
      lock: { mode: 'pessimistic_write' },
    });
  }

  private validateBidAgainstTop(
    auction: Auction,
    currentTopBid: Bid | null,
    amountKobo: number,
  ) {
    if (!currentTopBid) {
      return true;
    }

    const minimumTopBid =
      currentTopBid.amountKobo + auction.minimumBidIncrementKobo;

    if (auction.category === ListingCategory.Car && amountKobo < minimumTopBid) {
      throw new BadRequestException('Bid does not meet the minimum increment');
    }

    if (auction.category === ListingCategory.Car) {
      return true;
    }

    if (amountKobo > currentTopBid.amountKobo && amountKobo < minimumTopBid) {
      throw new BadRequestException('Bid does not meet the minimum increment');
    }

    return amountKobo > currentTopBid.amountKobo;
  }

  private calculateRequiredBalance(basePriceKobo: number, holdPercent: number) {
    return Math.ceil((basePriceKobo * holdPercent) / 100);
  }

  private async replaceTopBid(
    manager: EntityManager,
    auction: Auction,
    previousTopBid: Bid | null,
    bid: Bid,
  ) {
    if (previousTopBid) {
      previousTopBid.status = BidStatus.Outbid;
      await manager.save(previousTopBid);
    }

    auction.currentWinningBidId = bid.id;
    await manager.save(auction);
  }

  private async publishBidEvents(input: {
    auctionId: string;
    bid: Bid;
    isTopBid: boolean;
    previousTopBid: Bid | null;
  }) {
    this.bidsGateway.emitBidPlaced({
      auctionId: input.auctionId,
      bid: input.bid,
      isTopBid: input.isTopBid,
    });

    if (!input.isTopBid) {
      return;
    }

    this.bidsGateway.emitTopBidChanged({
      auctionId: input.auctionId,
      bid: input.bid,
      previousBid: input.previousTopBid,
    });

    await this.notifyOutbidUser(input);
  }

  private async notifyOutbidUser(input: {
    auctionId: string;
    bid: Bid;
    previousTopBid: Bid | null;
  }) {
    const previousTopBid = input.previousTopBid;

    if (!previousTopBid || previousTopBid.bidderId === input.bid.bidderId) {
      return;
    }

    this.bidsGateway.emitOutbid({
      userId: previousTopBid.bidderId,
      auctionId: input.auctionId,
      bid: previousTopBid,
      newTopBid: input.bid,
    });

    try {
      await this.notificationsService.create({
        audience: NotificationAudience.User,
        recipientId: previousTopBid.bidderId,
        type: NotificationType.Outbid,
        title: 'You have been outbid',
        message: 'A higher bid has replaced your current winning bid.',
        data: {
          auctionId: input.auctionId,
          bidId: previousTopBid.id,
          newTopBidId: input.bid.id,
          previousAmountKobo: previousTopBid.amountKobo,
          newTopAmountKobo: input.bid.amountKobo,
        },
      });
    } catch (error) {
      this.logger.error(
        error instanceof Error
          ? error.message
          : 'Failed to create outbid notification',
      );
    }
  }
}
