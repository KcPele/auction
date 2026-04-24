import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { BidStatus } from '../../common/enums/bid-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { Auction } from '../auctions/entities/auction.entity';
import { WalletsService } from '../wallets/wallets.service';
import { PlaceBidDto } from './dto/place-bid.dto';
import { Bid } from './entities/bid.entity';
import { presentBid } from './presenters/bid.presenter';

@Injectable()
export class BidsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Auction)
    private readonly auctionsRepository: Repository<Auction>,
    @InjectRepository(Bid)
    private readonly bidsRepository: Repository<Bid>,
    private readonly walletsService: WalletsService,
  ) {}

  async placeBid(userId: string, auctionId: string, dto: PlaceBidDto) {
    return this.dataSource.transaction(async (manager) => {
      const auction = await this.findAuctionForUpdate(manager, auctionId);

      this.assertCanBid(auction, userId, dto.amountKobo);

      const currentTopBid = await this.findCurrentTopBid(manager, auction);
      const becomesTopBid = this.validateBidAgainstTop(
        auction,
        currentTopBid,
        dto.amountKobo,
      );
      const holdAmountKobo = this.calculateHoldAmount(
        dto.amountKobo,
        auction.holdPercent,
      );
      const holdReference = `bid_hold_${auction.id}_${userId}_${Date.now()}`;
      const { hold } = await this.walletsService.createBidHold(manager, {
        userId,
        auctionId: auction.id,
        amountKobo: holdAmountKobo,
        reference: holdReference,
        metadata: { auctionId: auction.id, bidAmountKobo: dto.amountKobo },
      });
      const bid = await manager.save(
        manager.create(Bid, {
          auctionId: auction.id,
          bidderId: userId,
          amountKobo: dto.amountKobo,
          walletHoldId: hold.id,
          status: becomesTopBid ? BidStatus.Winning : BidStatus.Accepted,
        }),
      );

      await this.walletsService.attachBidToHold(manager, hold.id, bid.id);

      if (becomesTopBid) {
        await this.replaceTopBid(manager, auction, currentTopBid, bid);
      }

      return {
        bid: presentBid(bid),
        walletHold: hold,
        auction,
        isTopBid: becomesTopBid,
      };
    });
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

  private calculateHoldAmount(amountKobo: number, holdPercent: number) {
    return Math.ceil((amountKobo * holdPercent) / 100);
  }

  private async replaceTopBid(
    manager: EntityManager,
    auction: Auction,
    previousTopBid: Bid | null,
    bid: Bid,
  ) {
    if (previousTopBid?.walletHoldId) {
      previousTopBid.status = BidStatus.Outbid;
      await manager.save(previousTopBid);
      await this.walletsService.releaseBidHold(manager, {
        holdId: previousTopBid.walletHoldId,
        reference: `outbid_release_${previousTopBid.id}`,
        metadata: {
          auctionId: auction.id,
          bidId: previousTopBid.id,
          newTopBidId: bid.id,
        },
      });
    }

    auction.currentWinningBidId = bid.id;
    await manager.save(auction);
  }
}
