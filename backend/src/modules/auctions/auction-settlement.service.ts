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
import { DeliveryStatus } from '../../common/enums/delivery-status.enum';
import { NotificationAudience } from '../../common/enums/notification-audience.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { WalletLedgerType } from '../../common/enums/wallet-ledger-type.enum';
import { WalletHoldStatus } from '../../common/enums/wallet-hold-status.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { PaymentAccountSetting } from '../admin/entities/payment-account-setting.entity';
import { Bid } from '../bids/entities/bid.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletsService } from '../wallets/wallets.service';
import { WalletLedgerEntry } from '../wallets/entities/wallet-ledger-entry.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletHold } from '../wallets/entities/wallet-hold.entity';
import { Auction } from './entities/auction.entity';
import { AuctionDelivery } from './entities/auction-delivery.entity';
import { presentAuction } from './presenters/auction.presenter';
import {
  createLifecycleNotifications,
  type LifecycleNotification,
} from './auction-lifecycle.helpers';

type SettleAuctionPaymentInput = {
  externalPaymentKobo?: number;
  walletPaymentKobo?: number;
  note?: string;
};
type DefaultAuctionPaymentInput = {
  reason?: string;
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
    @InjectRepository(WalletHold)
    private readonly walletHoldsRepository: Repository<WalletHold>,
    private readonly notificationsService: NotificationsService,
    private readonly walletsService: WalletsService,
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

    const winningHold = winningBid.walletHoldId
      ? await this.walletHoldsRepository.findOneBy({
          id: winningBid.walletHoldId,
          status: WalletHoldStatus.Active,
        })
      : null;
    const holdAppliedKobo = winningHold?.amountKobo ?? 0;

    return {
      auction: presentAuction(auction),
      winningBid: {
        id: winningBid.id,
        amountKobo: winningBid.amountKobo,
        holdAppliedKobo,
        amountDueKobo: winningBid.amountKobo - holdAppliedKobo,
      },
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
      const winningHold = winningBid.walletHoldId
        ? await manager.findOne(WalletHold, {
            where: {
              id: winningBid.walletHoldId,
              status: WalletHoldStatus.Active,
            },
            lock: { mode: 'pessimistic_write' },
          })
        : null;
      const holdAppliedKobo = winningHold?.amountKobo ?? 0;

      const totalPaymentKobo =
        externalPaymentKobo + walletPaymentKobo + holdAppliedKobo;
      if (totalPaymentKobo < winningBid.amountKobo) {
        throw new BadRequestException(
          'Payment amount is below the winning bid amount',
        );
      }
      if (totalPaymentKobo > winningBid.amountKobo) {
        throw new BadRequestException(
          'Payment amount exceeds the winning bid amount',
        );
      }

      if (walletPaymentKobo > 0) {
        await this.applyWinnerWalletPayment(manager, {
          auction,
          amountKobo: walletPaymentKobo,
          note: input.note,
        });
      }

      if (winningBid.walletHoldId) {
        await this.walletsService.applyBidHold(manager, {
          holdId: winningBid.walletHoldId,
          reference: `auction_settle_${auction.id}_bid_${winningBid.id}`,
          metadata: {
            auctionId: auction.id,
            bidId: winningBid.id,
            reason: 'applied_to_winning_payment',
          },
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
      const delivery = await manager.save(
        manager.create(AuctionDelivery, {
          auctionId: auction.id,
          winnerId: auction.winnerId,
          sellerId: auction.sellerId,
          status: DeliveryStatus.PaymentConfirmed,
          trackingInfo: null,
        }),
      );
      return { auction, winningBid, delivery };
    });

    await createLifecycleNotifications(this.notificationsService, this.logger, [
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
      delivery: result.delivery,
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

      if (auction.currentWinningBidId) {
        const winningBid = await this.findWinningBidForUpdate(
          manager,
          auction.currentWinningBidId,
        );
        if (winningBid.walletHoldId) {
          await this.walletsService.forfeitBidHold(manager, {
            holdId: winningBid.walletHoldId,
            reference: `auction_default_${auction.id}_bid_${winningBid.id}`,
            metadata: {
              auctionId: auction.id,
              bidId: winningBid.id,
              reason: 'payment_defaulted',
            },
          });
        }
        winningBid.status = BidStatus.Cancelled;
        await manager.save(winningBid);
      }

      auction.status = AuctionStatus.Defaulted;
      auction.defaultedAt = new Date();
      auction.defaultReason =
        input.reason?.trim() || 'Winner did not pay before the deadline';

      await manager.save(auction);
      return { auction, changed: true };
    });

    if (result.changed) {
      await createLifecycleNotifications(this.notificationsService, this.logger, [
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
    const result = await this.dataSource.transaction(async (manager) => {
      const auction = await this.findAuctionForUpdate(manager, auctionId);
      if (auction.status !== AuctionStatus.AwaitingPayment)
        throw new BadRequestException('Auction is not awaiting payment');
      if (auction.winnerId !== user.id)
        throw new BadRequestException('Only the winner can confirm payment');
      if (auction.winnerPaymentConfirmedAt)
        return { auction, changed: false };
      auction.winnerPaymentConfirmedAt = new Date();
      auction.winnerPaymentNote = note?.trim().slice(0, 1000) || null;
      await manager.save(auction);
      return { auction, changed: true };
    });

    if (!result.changed) {
      return {
        message: 'Payment confirmation was already sent.',
        changed: false,
        auction: presentAuction(result.auction),
      };
    }

    await createLifecycleNotifications(this.notificationsService, this.logger, [
      {
        recipientId: result.auction.sellerId,
        type: NotificationType.System,
        title: 'Winner payment notification',
        message: `The winner has confirmed they made the transfer.${note ? ` Note: ${note}` : ''}`,
        data: { auctionId: result.auction.id, winnerConfirmed: true },
      },
    ]);
    await this.notificationsService.create({
      audience: NotificationAudience.Admin,
      type: NotificationType.PaymentDue,
      title: 'Payment verification required',
      message: 'An auction winner reported payment. Verify it before settlement.',
      data: { auctionId: result.auction.id, winnerId: user.id },
    });

    return {
      message: 'Payment confirmation sent. Admin will verify and settle.',
      changed: true,
      auction: presentAuction(result.auction),
    };
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

    const isAdmin = user.role === UserRole.Admin;
    const confirmsReceipt = status === DeliveryStatus.Delivered;
    if (confirmsReceipt && delivery.winnerId !== user.id && !isAdmin) {
      throw new BadRequestException('Only the buyer or admin can confirm delivery');
    }
    if (!confirmsReceipt && delivery.sellerId !== user.id && !isAdmin) {
      throw new BadRequestException(
        'Only the seller or admin can progress delivery',
      );
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

    const recipientIds =
      user.role === UserRole.Admin
        ? [...new Set([delivery.sellerId, delivery.winnerId])]
        : [delivery.sellerId === user.id ? delivery.winnerId : delivery.sellerId];
    await createLifecycleNotifications(
      this.notificationsService,
      this.logger,
      recipientIds.map((recipientId) => ({
        recipientId,
        type: NotificationType.System,
        title: 'Delivery update',
        message: `Delivery status updated to ${status.replace(/_/g, ' ').toLowerCase()}.`,
        data: { auctionId, deliveryStatus: status },
      })),
    );

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

    if (wallet.balanceKobo - wallet.heldKobo < input.amountKobo) {
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

}
