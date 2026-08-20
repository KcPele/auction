import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { NotificationAudience } from '../../common/enums/notification-audience.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { Dispute } from '../admin/entities/dispute.entity';
import { Auction } from '../auctions/entities/auction.entity';
import { Bid } from '../bids/entities/bid.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';

@Injectable()
export class UserDisputesService {
  constructor(
    @InjectRepository(Dispute)
    private readonly disputesRepository: Repository<Dispute>,
    @InjectRepository(Auction)
    private readonly auctionsRepository: Repository<Auction>,
    @InjectRepository(Bid)
    private readonly bidsRepository: Repository<Bid>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listForUser(userId: string) {
    const items = await this.disputesRepository.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      order: { createdAt: 'DESC' },
    });
    return { items };
  }

  async create(userId: string, dto: CreateDisputeDto) {
    const auction = await this.auctionsRepository.findOneBy({ id: dto.auctionId });
    if (!auction) throw new NotFoundException('Auction not found');
    if (auction.status !== AuctionStatus.Settled) {
      throw new BadRequestException('Only settled auctions can be disputed');
    }
    if (!auction.winnerId || !auction.currentWinningBidId) {
      throw new BadRequestException('Auction has no winning bid');
    }
    if (userId !== auction.winnerId && userId !== auction.sellerId) {
      throw new BadRequestException('Only the buyer or seller can open a dispute');
    }
    if (await this.disputesRepository.findOneBy({ auctionId: auction.id })) {
      throw new BadRequestException('A dispute already exists for this auction');
    }

    const winningBid = await this.bidsRepository.findOneBy({
      id: auction.currentWinningBidId,
    });
    if (!winningBid) throw new NotFoundException('Winning bid not found');

    const dispute = await this.disputesRepository.save(
      this.disputesRepository.create({
        auctionId: auction.id,
        buyerId: auction.winnerId,
        sellerId: auction.sellerId,
        amountKobo: String(winningBid.amountKobo),
        reason: dto.reason.trim(),
      }),
    );

    await this.notificationsService.create({
      audience: NotificationAudience.Admin,
      type: NotificationType.System,
      title: 'New auction dispute',
      message: 'A buyer or seller opened a dispute that needs review.',
      data: { disputeId: dispute.id, auctionId: auction.id },
    });

    return { dispute };
  }
}
