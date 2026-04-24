import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DefaultPlatformFees } from '../../common/constants/platform-fees';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { ListingStatus } from '../../common/enums/listing-status.enum';
import { Bid } from '../bids/entities/bid.entity';
import { CarListing } from '../cars/entities/car-listing.entity';
import { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
import { PlatformFeeSetting } from '../admin/entities/platform-fee-setting.entity';
import { CancelAuctionDto } from './dto/cancel-auction.dto';
import { ListAuctionsQueryDto } from './dto/list-auctions-query.dto';
import { Auction } from './entities/auction.entity';
import { presentAuction } from './presenters/auction.presenter';

type AuctionListing = CarListing | GadgetListing;

@Injectable()
export class AuctionsService {
  constructor(
    @InjectRepository(Auction)
    private readonly auctionsRepository: Repository<Auction>,
    @InjectRepository(Bid)
    private readonly bidsRepository: Repository<Bid>,
    @InjectRepository(CarListing)
    private readonly carListingsRepository: Repository<CarListing>,
    @InjectRepository(GadgetListing)
    private readonly gadgetListingsRepository: Repository<GadgetListing>,
    @InjectRepository(PlatformFeeSetting)
    private readonly feesRepository: Repository<PlatformFeeSetting>,
  ) {}

  async createFromApprovedListing(category: ListingCategory, listingId: string) {
    const existing = await this.auctionsRepository.findOneBy({
      category,
      listingId,
    });

    if (existing) {
      return { auction: presentAuction(existing), created: false };
    }

    const listing = await this.findApprovedListing(category, listingId);
    const fee = await this.findFee(category);
    const endTime = new Date(
      listing.startTime.getTime() + listing.durationMinutes * 60_000,
    );
    const auction = await this.auctionsRepository.save(
      this.auctionsRepository.create({
        category,
        listingId: listing.id,
        sellerId: listing.listerId,
        basePriceKobo: Number(listing.basePriceKobo),
        minimumBidIncrementKobo: Number(listing.minimumBidIncrementKobo),
        holdPercent: listing.holdPercent,
        sellerFeeBps: fee.sellerFeeBps,
        buyerFeeBps: fee.buyerFeeBps,
        startTime: listing.startTime,
        durationMinutes: listing.durationMinutes,
        endTime,
        status: AuctionStatus.Scheduled,
      }),
    );

    return { auction: presentAuction(auction), created: true };
  }

  async list(query: ListAuctionsQueryDto) {
    const where = {
      ...(query.category ? { category: query.category } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const auctions = await this.auctionsRepository.find({
      where,
      order: { startTime: 'ASC', createdAt: 'DESC' },
      take: query.limit,
      skip: query.offset,
    });

    return { auctions: auctions.map(presentAuction) };
  }

  async findOne(id: string) {
    return { auction: presentAuction(await this.findAuction(id)) };
  }

  async listBids(auctionId: string) {
    await this.findAuction(auctionId);
    const bids = await this.bidsRepository.find({
      where: { auctionId },
      order: { amountKobo: 'DESC', createdAt: 'ASC' },
    });

    return { bids };
  }

  async cancel(adminId: string, auctionId: string, dto: CancelAuctionDto) {
    const auction = await this.findAuction(auctionId);

    if (
      ![AuctionStatus.Scheduled, AuctionStatus.Live].includes(auction.status)
    ) {
      throw new BadRequestException('Only scheduled or live auctions can be cancelled');
    }

    Object.assign(auction, {
      status: AuctionStatus.Cancelled,
      cancelledById: adminId,
      cancellationReason: dto.reason?.trim() ?? null,
      cancelledAt: new Date(),
    });

    return {
      auction: presentAuction(await this.auctionsRepository.save(auction)),
    };
  }

  private async findAuction(id: string) {
    const auction = await this.auctionsRepository.findOneBy({ id });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    return auction;
  }

  private async findApprovedListing(
    category: ListingCategory,
    listingId: string,
  ): Promise<AuctionListing> {
    const repository = this.getListingRepository(category);
    const listing = await repository.findOneBy({
      id: listingId,
      status: ListingStatus.Approved,
    });

    if (!listing) {
      throw new NotFoundException('Approved listing not found');
    }

    return listing;
  }

  private getListingRepository(category: ListingCategory) {
    return category === ListingCategory.Car
      ? this.carListingsRepository
      : this.gadgetListingsRepository;
  }

  private async findFee(category: ListingCategory) {
    const existing = await this.feesRepository.findOneBy({ category });

    return existing ?? DefaultPlatformFees[category];
  }
}
