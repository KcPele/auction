import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PaymentProvider } from '../../common/enums/payment-provider.enum';
import { TopUpStatus } from '../../common/enums/top-up-status.enum';
import { WalletLedgerType } from '../../common/enums/wallet-ledger-type.enum';
import { CreateTopUpDto } from './dto/create-top-up.dto';
import { ListWalletLedgerQueryDto } from './dto/list-wallet-ledger-query.dto';
import { WalletLedgerEntry } from './entities/wallet-ledger-entry.entity';
import { WalletHold } from './entities/wallet-hold.entity';
import { WalletTopUp } from './entities/wallet-top-up.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletHoldStatus } from '../../common/enums/wallet-hold-status.enum';
import { presentWallet } from './presenters/wallet.presenter';

@Injectable()
export class WalletsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Wallet)
    private readonly walletsRepository: Repository<Wallet>,
    @InjectRepository(WalletLedgerEntry)
    private readonly ledgerRepository: Repository<WalletLedgerEntry>,
    @InjectRepository(WalletTopUp)
    private readonly topUpsRepository: Repository<WalletTopUp>,
  ) {}

  async getWallet(userId: string) {
    const wallet = await this.ensureWallet(userId);

    return { wallet: presentWallet(wallet) };
  }

  async listLedger(userId: string, query: ListWalletLedgerQueryDto) {
    const wallet = await this.ensureWallet(userId);
    const ledgerEntries = await this.ledgerRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      take: query.limit,
      skip: query.offset,
    });

    return { ledgerEntries };
  }

  async createTopUp(userId: string, dto: CreateTopUpDto) {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await this.ensureWallet(userId, manager);
      const providerReference = `wallet_topup_${randomUUID()}`;
      const topUp = await manager.save(
        manager.create(WalletTopUp, {
          walletId: wallet.id,
          userId,
          amountKobo: dto.amountKobo,
          currency: dto.currency ?? wallet.currency,
          provider: PaymentProvider.Opay,
          providerReference,
          checkoutUrl: null,
          providerPayload: {
            mode: 'local-placeholder',
            providerReference,
          },
        }),
      );

      await this.writeLedger(manager, wallet, {
        type: WalletLedgerType.TopUpInitiated,
        amountKobo: 0,
        reference: providerReference,
        metadata: { topUpId: topUp.id, amountKobo: dto.amountKobo },
      });

      return {
        topUp,
        payment: {
          provider: PaymentProvider.Opay,
          providerReference,
          checkoutUrl: topUp.checkoutUrl,
          status: topUp.status,
        },
      };
    });
  }

  async getTopUp(userId: string, topUpId: string) {
    const topUp = await this.topUpsRepository.findOneBy({
      id: topUpId,
      userId,
    });

    if (!topUp) {
      throw new NotFoundException('Top-up not found');
    }

    return { topUp };
  }

  async confirmTopUpByReference(
    providerReference: string,
    payload: Record<string, unknown>,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const topUp = await this.findTopUpForUpdate(manager, providerReference);

      if (topUp.status === TopUpStatus.Confirmed) {
        return { topUp, alreadyProcessed: true };
      }

      const wallet = await this.findWalletForUpdate(manager, topUp.walletId);
      const balanceBeforeKobo = wallet.balanceKobo;

      wallet.balanceKobo += topUp.amountKobo;
      topUp.status = TopUpStatus.Confirmed;
      topUp.confirmedAt = new Date();
      topUp.providerPayload = payload;

      await manager.save(wallet);
      await manager.save(topUp);
      await this.writeLedger(manager, wallet, {
        type: WalletLedgerType.TopUpConfirmed,
        amountKobo: topUp.amountKobo,
        balanceBeforeKobo,
        reference: providerReference,
        metadata: { topUpId: topUp.id },
      });

      return { topUp, alreadyProcessed: false };
    });
  }

  async failTopUpByReference(
    providerReference: string,
    payload: Record<string, unknown>,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const topUp = await this.findTopUpForUpdate(manager, providerReference);

      if (topUp.status !== TopUpStatus.Pending) {
        return { topUp, alreadyProcessed: true };
      }

      topUp.status = TopUpStatus.Failed;
      topUp.providerPayload = payload;

      return {
        topUp: await manager.save(topUp),
        alreadyProcessed: false,
      };
    });
  }

  async createBidHold(
    manager: EntityManager,
    input: {
      userId: string;
      auctionId: string;
      amountKobo: number;
      reference: string;
      metadata: Record<string, unknown>;
    },
  ) {
    const wallet = await this.ensureWalletForUpdate(input.userId, manager);
    const availableKobo = wallet.balanceKobo - wallet.heldKobo;

    if (availableKobo < input.amountKobo) {
      throw new BadRequestException('Insufficient available wallet balance');
    }

    const heldBeforeKobo = wallet.heldKobo;
    wallet.heldKobo += input.amountKobo;

    const hold = await manager.save(
      manager.create(WalletHold, {
        walletId: wallet.id,
        userId: input.userId,
        auctionId: input.auctionId,
        amountKobo: input.amountKobo,
      }),
    );

    await manager.save(wallet);
    await this.writeLedger(manager, wallet, {
      type: WalletLedgerType.BidHoldCreated,
      amountKobo: input.amountKobo,
      heldBeforeKobo,
      reference: input.reference,
      metadata: { ...input.metadata, holdId: hold.id },
    });

    return { wallet, hold };
  }

  async attachBidToHold(
    manager: EntityManager,
    holdId: string,
    bidId: string,
  ) {
    await manager.update(WalletHold, holdId, { bidId });
  }

  async releaseBidHold(
    manager: EntityManager,
    input: {
      holdId: string;
      reference: string;
      metadata: Record<string, unknown>;
    },
  ) {
    const hold = await manager.findOne(WalletHold, {
      where: { id: input.holdId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!hold || hold.status !== WalletHoldStatus.Active) {
      return { hold, released: false };
    }

    const wallet = await this.findWalletForUpdate(manager, hold.walletId);
    const heldBeforeKobo = wallet.heldKobo;
    wallet.heldKobo -= hold.amountKobo;
    hold.status = WalletHoldStatus.Released;
    hold.releasedAt = new Date();

    await manager.save(wallet);
    await manager.save(hold);
    await this.writeLedger(manager, wallet, {
      type: WalletLedgerType.BidHoldReleased,
      amountKobo: hold.amountKobo,
      heldBeforeKobo,
      reference: input.reference,
      metadata: { ...input.metadata, holdId: hold.id },
    });

    return { hold, released: true };
  }

  private async ensureWallet(userId: string, manager?: EntityManager) {
    const repository = manager?.getRepository(Wallet) ?? this.walletsRepository;
    const existing = await repository.findOneBy({ userId });

    if (existing) {
      return existing;
    }

    return repository.save(repository.create({ userId }));
  }

  private async ensureWalletForUpdate(userId: string, manager: EntityManager) {
    const wallet = await manager.findOne(Wallet, {
      where: { userId },
      lock: { mode: 'pessimistic_write' },
    });

    if (wallet) {
      return wallet;
    }

    return manager.save(manager.create(Wallet, { userId }));
  }

  private async findTopUpForUpdate(
    manager: EntityManager,
    providerReference: string,
  ) {
    const topUp = await manager.findOne(WalletTopUp, {
      where: { providerReference },
      lock: { mode: 'pessimistic_write' },
    });

    if (!topUp) {
      throw new NotFoundException('Top-up not found');
    }

    return topUp;
  }

  private async findWalletForUpdate(manager: EntityManager, walletId: string) {
    const wallet = await manager.findOne(Wallet, {
      where: { id: walletId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  private async writeLedger(
    manager: EntityManager,
    wallet: Wallet,
    input: {
      type: WalletLedgerType;
      amountKobo: number;
      balanceBeforeKobo?: number;
      heldBeforeKobo?: number;
      reference: string;
      metadata: Record<string, unknown>;
    },
  ) {
    const balanceBeforeKobo = input.balanceBeforeKobo ?? wallet.balanceKobo;
    const heldBeforeKobo = input.heldBeforeKobo ?? wallet.heldKobo;

    return manager.save(
      manager.create(WalletLedgerEntry, {
        walletId: wallet.id,
        userId: wallet.userId,
        type: input.type,
        amountKobo: input.amountKobo,
        balanceBeforeKobo,
        balanceAfterKobo: wallet.balanceKobo,
        heldBeforeKobo,
        heldAfterKobo: wallet.heldKobo,
        reference: input.reference,
        metadata: input.metadata,
      }),
    );
  }
}
