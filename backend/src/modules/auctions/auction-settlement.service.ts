import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { DeliveryStatus } from '../../common/enums/delivery-status.enum';
import { NotificationAudience } from '../../common/enums/notification-audience.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { WalletLedgerType } from '../../common/enums/wallet-ledger-type.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { PaymentAccountSetting } from '../admin/entities/payment-account-setting.entity';
import { Bid } from '../bids/entities/bid.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletLedgerEntry } from '../wallets/entities/wallet-ledger-entry.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { Auction } from './entities/auction.entity';
import { AuctionDelivery } from './entities/auction-delivery.entity';
import { presentAuction } from './presenters/auction.presenter';

type SettleAuctionPaymentInput = {
  externalPaymentKobo?: number;
  walletPaymentKobo?: number;
  note?: string;
};
type DefaultAuctionPaymentInput = {
  reason?: string;
};
type LifecycleNotification = {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
};

@Injectable()
export class AuctionSettlementService {
  private readonly logger = new Logger(AuctionSettlementService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Auction)
    private readonly auctionsRepository: Repository<Auction>,
    @InjectRepository(Bid)
    private readonly bidsRepository: Repository<Bid>,
    @InjectRepository(PaymentAccountSetting)
    private readonly paymentAccountsRepository: Repository<PaymentAccountSetting>,
    @InjectRepository(AuctionDelivery)
    private readonly deliveryRepository: Repository<AuctionDelivery>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getPaymentInstructions(user: AuthenticatedUser, auctionId: string) {
    const auction = await this.findAuction(auctionId);

    if (auction.status !== AuctionStatus.AwaitingPayment) {
      throw new BadRequestException('Auction is not awaiting payment');
    }

    if (auction.winnerId !== user.id && user.role !== UserRole.Admin) {
      throw new BadRequestException('Only the winner can view payment instructions');
    }

    if (!auction.currentWinningBidId) {
      throw new NotFoundException('Winning bid not found');
    }

    const [winningBid, paymentAccount] = await Promise.all([
      this.bidsRepository.findOneBy({ id: auction.currentWinningBidId }),
      this.paymentAccountsRepository.findOneBy({ id: 'default' }),
    ]);

    if (!winningBid) {
      throw new NotFoundException('Winning bid not found');
    }

    if (!paymentAccount) {
      throw new NotFoundException('Payment account is not configured');
    }

    return {
      auction: presentAuction(auction),
      winningBid: { id: winningBid.id, amountKobo: winningBid.amountKobo },
      paymentDeadlineAt: auction.paymentDeadlineAt,
      paymentAccount: {
        bankName: paymentAccount.bankName,
        accountNumber: paymentAccount.accountNumber,
        accountName: paymentAccount.accountName,
      },
    };
  }

  async settleAuctionPayment(
    adminId: string,
    auctionId: string,
    input: SettleAuctionPaymentInput,
  ) {
    const result = await this.dataSource.transaction(async (manager) => {
      const auction = await this.findAuctionForUpdate(manager, auctionId);

      if (auction.status !== AuctionStatus.AwaitingPayment) {
        throw new BadRequestException('Auction is not awaiting payment');
      }

      if (!auction.currentWinningBidId || !auction.winnerId) {
        throw new NotFoundException('Winning bid not found');
      }

      const winningBid = await this.findWinningBidForUpdate(
        manager,
        auction.currentWinningBidId,
      );
      const externalPaymentKobo = input.externalPaymentKobo ?? 0;
      const walletPaymentKobo = input.walletPaymentKobo ?? 0;

      if (externalPaymentKobo + walletPaymentKobo < winningBid.amountKobo) {
        throw new BadRequestException(
          'Payment amount is below the winning bid amount',
        );
      }

      if (walletPaymentKobo > 0) {
        await this.applyWinnerWalletPayment(manager, {
          auction,
          amountKobo: walletPaymentKobo,
          note: input.note,
        });
      }

      Object.assign(auction, {
        status: AuctionStatus.Settled,
        externalPaymentKobo,
        walletPaymentKobo,
        settledById: adminId,
        settledAt: new Date(),
      });

      await manager.save(auction);
      return { auction, winningBid };
    });

    await this.createLifecycleNotifications([
      {
        recipientId: result.auction.winnerId as string,
        type: NotificationType.System,
        title: 'Payment confirmed',
        message: 'Your auction payment has been confirmed.',
        data: { auctionId: result.auction.id },
      },
      {
        recipientId: result.auction.sellerId,
        type: NotificationType.System,
        title: 'Auction settled',
        message: 'The winning payment for your auction has been confirmed.',
        data: { auctionId: result.auction.id },
      },
    ]);

    return {
      auction: presentAuction(result.auction),
      winningBid: result.winningBid,
    };
  }

  async defaultAuctionPayment(
    auctionId: string,
    input: DefaultAuctionPaymentInput = {},
  ) {
    const result = await this.dataSource.transaction(async (manager) => {
      const auction = await this.findAuctionForUpdate(manager, auctionId);

      if (auction.status !== AuctionStatus.AwaitingPayment) {
        return { auction, changed: false };
      }

      if (
        auction.paymentDeadlineAt &&
        auction.paymentDeadlineAt.getTime() > Date.now()
      ) {
        return { auction, changed: false };
      }

      auction.status = AuctionStatus.Defaulted;
      auction.defaultedAt = new Date();
      auction.defaultReason =
        input.reason?.trim() || 'Winner did not pay before the deadline';

      await manager.save(auction);
      return { auction, changed: true };
    });

    if (result.changed) {
      await this.createLifecycleNotifications([
        {
          recipientId: result.auction.winnerId as string,
          type: NotificationType.System,
          title: 'Payment deadline missed',
          message: 'Your auction win has defaulted because payment was not confirmed.',
          data: { auctionId: result.auction.id },
        },
        {
          recipientId: result.auction.sellerId,
          type: NotificationType.System,
          title: 'Auction payment defaulted',
          message: 'The winner did not complete payment before the deadline.',
          data: { auctionId: result.auction.id },
        },
      ]);
    }

    return { auction: presentAuction(result.auction), changed: result.changed };
  }

  async confirmWinnerPayment(
    user: AuthenticatedUser,
    auctionId: string,
    note?: string,
  ) {
    const auction = await this.findAuction(auctionId);

    if (auction.status !== AuctionStatus.AwaitingPayment) {
      throw new BadRequestException('Auction is not awaiting payment');
    }

    if (auction.winnerId !== user.id) {
      throw new BadRequestException('Only the winner can confirm payment');
    }

    await this.createLifecycleNotifications([
      {
        recipientId: auction.sellerId,
        type: NotificationType.System,
        title: 'Winner payment notification',
        message: `The winner has confirmed they made the transfer.${note ? ` Note: ${note}` : ''}`,
        data: { auctionId: auction.id, winnerConfirmed: true },
      },
    ]);

    return { message: 'Payment confirmation sent. Admin will verify and settle.' };
  }

  async updateDeliveryStatus(
    user: AuthenticatedUser,
    auctionId: string,
    status: DeliveryStatus,
  ) {
    const auction = await this.findAuction(auctionId);

    if (auction.status !== AuctionStatus.Settled) {
      throw new BadRequestException('Auction is not settled yet');
    }

    const delivery = await this.deliveryRepository.findOneBy({ auctionId });
    if (!delivery) {
      throw new NotFoundException('Delivery record not found');
    }

    if (delivery.sellerId !== user.id && user.role !== UserRole.Admin) {
      throw new BadRequestException('Only the seller or admin can update delivery status');
    }

    const validTransitions: Record<string, string[]> = {
      [DeliveryStatus.PaymentConfirmed]: [DeliveryStatus.SellerShips],
      [DeliveryStatus.SellerShips]: [DeliveryStatus.Inspection],
      [DeliveryStatus.Inspection]: [DeliveryStatus.Dispatch],
      [DeliveryStatus.Dispatch]: [DeliveryStatus.Delivered],
    };

    const allowed = validTransitions[delivery.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${delivery.status} to ${status}`,
      );
    }

    delivery.status = status;
    await this.deliveryRepository.save(delivery);

    const recipientId =
      delivery.sellerId === user.id ? delivery.winnerId : delivery.sellerId;
    await this.createLifecycleNotifications([
      {
        recipientId,
        type: NotificationType.System,
        title: 'Delivery update',
        message: `Delivery status updated to ${status.replace(/_/g, ' ').toLowerCase()}.`,
        data: { auctionId, deliveryStatus: status },
      },
    ]);

    return { delivery };
  }

  async getDeliveryStatus(user: AuthenticatedUser, auctionId: string) {
    const auction = await this.findAuction(auctionId);

    if (
      auction.winnerId !== user.id &&
      auction.sellerId !== user.id &&
      user.role !== UserRole.Admin
    ) {
      throw new BadRequestException('Not authorized to view delivery status');
    }

    const delivery = await this.deliveryRepository.findOneBy({ auctionId });
    if (!delivery) {
      throw new NotFoundException('Delivery record not found');
    }

    return { delivery };
  }

  private async findAuction(id: string) {
    const auction = await this.auctionsRepository.findOneBy({ id });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    return auction;
  }

  private async findAuctionForUpdate(manager: EntityManager, auctionId: string) {
    const auction = await manager.findOne(Auction, {
      where: { id: auctionId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    return auction;
  }

  private async findWinningBidForUpdate(manager: EntityManager, bidId: string) {
    const winningBid = await manager.findOne(Bid, {
      where: { id: bidId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!winningBid) {
      throw new NotFoundException('Winning bid not found');
    }

    return winningBid;
  }

  private async applyWinnerWalletPayment(
    manager: EntityManager,
    input: { auction: Auction; amountKobo: number; note?: string },
  ) {
    const wallet = await manager.findOne(Wallet, {
      where: { userId: input.auction.winnerId as string },
      lock: { mode: 'pessimistic_write' },
    });

    if (!wallet) {
      throw new NotFoundException('Winner wallet not found');
    }

    if (wallet.balanceKobo < input.amountKobo) {
      throw new BadRequestException('Winner wallet balance is insufficient');
    }

    const balanceBeforeKobo = wallet.balanceKobo;
    wallet.balanceKobo -= input.amountKobo;
    await manager.save(wallet);
    await manager.save(
      manager.create(WalletLedgerEntry, {
        walletId: wallet.id,
        userId: wallet.userId,
        type: WalletLedgerType.FinalPaymentConfirmed,
        amountKobo: -input.amountKobo,
        balanceBeforeKobo,
        balanceAfterKobo: wallet.balanceKobo,
        heldBeforeKobo: wallet.heldKobo,
        heldAfterKobo: wallet.heldKobo,
        reference: `auction_settlement_${input.auction.id}`,
        metadata: { auctionId: input.auction.id, note: input.note ?? null },
      }),
    );
  }

  private async createLifecycleNotifications(
    notifications: LifecycleNotification[],
  ) {
    for (const notification of notifications) {
      try {
        await this.notificationsService.create({
          audience: NotificationAudience.User,
          ...notification,
        });
      } catch (error) {
        this.logger.error(
          error instanceof Error
            ? error.message
            : 'Failed to create settlement notification',
        );
      }
    }
  }
}
