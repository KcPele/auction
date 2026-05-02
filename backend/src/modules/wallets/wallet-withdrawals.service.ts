import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { PaymentProvider } from '../../common/enums/payment-provider.enum';
import { WalletLedgerType } from '../../common/enums/wallet-ledger-type.enum';
import { WalletWithdrawalStatus } from '../../common/enums/wallet-withdrawal-status.enum';
import { StrowalletProvider } from '../payments/providers/strowallet.provider';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ListWithdrawalsQueryDto } from './dto/list-withdrawals-query.dto';
import { WalletLedgerEntry } from './entities/wallet-ledger-entry.entity';
import { WalletWithdrawal } from './entities/wallet-withdrawal.entity';
import { Wallet } from './entities/wallet.entity';
import { presentWithdrawal } from './presenters/withdrawal.presenter';

@Injectable()
export class WalletWithdrawalsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(WalletWithdrawal)
    private readonly withdrawalsRepository: Repository<WalletWithdrawal>,
    private readonly strowalletProvider: StrowalletProvider,
  ) {}

  async createWithdrawal(userId: string, dto: CreateWithdrawalDto) {
    const withdrawal = await this.createPendingWithdrawal(userId, dto);

    try {
      const nameEnquiry = await this.strowalletProvider.getAccountName({
        bankCode: withdrawal.destinationBankCode,
        accountNumber: withdrawal.destinationAccountNumber,
      });
      const payout = await this.strowalletProvider.initiateBankTransfer({
        amountKobo: withdrawal.amountKobo,
        nameEnquiryReference: this.readNameEnquiryReference(nameEnquiry),
        narration: withdrawal.narration ?? 'Auction wallet withdrawal',
        bankCode: withdrawal.destinationBankCode,
        accountNumber: withdrawal.destinationAccountNumber,
        senderName: 'Auction Wallet',
      });
      const updated = await this.updateWithdrawalFromProvider(
        withdrawal.providerReference,
        this.readProviderStatus(payout),
        {
          ...(payout as Record<string, unknown>),
          nameEnquiry,
        },
      );

      return { withdrawal: presentWithdrawal(updated), payout };
    } catch (error) {
      const failed = await this.failWithdrawalByReference(
        withdrawal.providerReference,
        {
          reason:
            error instanceof Error
              ? error.message
              : 'Strowallet withdrawal initiation failed',
        },
      );

      throw new BadRequestException({
        message: 'Withdrawal could not be initiated',
        withdrawal: presentWithdrawal(failed.withdrawal),
      });
    }
  }

  async getWithdrawal(userId: string, withdrawalId: string) {
    const withdrawal = await this.withdrawalsRepository.findOneBy({
      id: withdrawalId,
      userId,
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    return { withdrawal: presentWithdrawal(withdrawal) };
  }

  async listUserWithdrawals(userId: string, query: ListWithdrawalsQueryDto) {
    const where: Record<string, unknown> = { userId };
    if (query.status) {
      where.status = query.status;
    }

    const [withdrawals, total] = await this.withdrawalsRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: query.limit,
      skip: query.offset,
    });

    return {
      items: withdrawals.map(presentWithdrawal),
      total,
    };
  }

  async listPendingWithdrawals() {
    const withdrawals = await this.withdrawalsRepository.find({
      where: {
        status: In([
          WalletWithdrawalStatus.Pending,
          WalletWithdrawalStatus.Processing,
        ]),
      },
      order: { createdAt: 'ASC' },
    });

    return { withdrawals: withdrawals.map(presentWithdrawal) };
  }

  async authorizeWithdrawal(withdrawalId: string, authorizationCode: string) {
    await this.findAuthorizableWithdrawal(withdrawalId);
    throw new BadRequestException(
      `Strowallet bank transfers do not require withdrawal OTP authorization: ${authorizationCode}`,
    );
  }

  async resendWithdrawalOtp(withdrawalId: string) {
    const withdrawal = await this.findAuthorizableWithdrawal(withdrawalId);
    return {
      withdrawal: presentWithdrawal(withdrawal),
      providerResponse: {
        message: 'Strowallet bank transfers do not require withdrawal OTP resend',
      },
    };
  }

  async updateWithdrawalFromProvider(
    providerReference: string,
    status: string,
    payload: Record<string, unknown>,
  ) {
    const normalizedStatus = this.toWithdrawalStatus(status);

    return this.dataSource.transaction(async (manager) => {
      const withdrawal = await this.findWithdrawalForUpdate(
        manager,
        providerReference,
      );

      if (withdrawal.status === WalletWithdrawalStatus.Completed) {
        return withdrawal;
      }

      if (normalizedStatus === WalletWithdrawalStatus.Failed) {
        return (await this.refundWithdrawal(manager, withdrawal, payload))
          .withdrawal;
      }

      withdrawal.status = normalizedStatus;
      withdrawal.providerPayload = payload;
      withdrawal.completedAt =
        normalizedStatus === WalletWithdrawalStatus.Completed
          ? new Date()
          : withdrawal.completedAt;
      await manager.save(withdrawal);

      if (normalizedStatus === WalletWithdrawalStatus.Completed) {
        const wallet = await this.findWalletForUpdate(manager, withdrawal.walletId);
        await this.writeLedger(manager, wallet, {
          type: WalletLedgerType.WithdrawalConfirmed,
          amountKobo: 0,
          reference: `${providerReference}_confirmed`,
          metadata: { withdrawalId: withdrawal.id },
        });
      }

      return withdrawal;
    });
  }

  async failWithdrawalByReference(
    providerReference: string,
    payload: Record<string, unknown>,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const withdrawal = await this.findWithdrawalForUpdate(
        manager,
        providerReference,
      );

      return this.refundWithdrawal(manager, withdrawal, payload);
    });
  }

  private async createPendingWithdrawal(
    userId: string,
    dto: CreateWithdrawalDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await this.ensureWalletForUpdate(userId, manager);
      const availableKobo = wallet.balanceKobo - wallet.heldKobo;

      if (availableKobo < dto.amountKobo) {
        throw new BadRequestException('Insufficient available wallet balance');
      }

      const balanceBeforeKobo = wallet.balanceKobo;
      wallet.balanceKobo -= dto.amountKobo;
      const withdrawal = await manager.save(
        manager.create(WalletWithdrawal, {
          walletId: wallet.id,
          userId,
          amountKobo: dto.amountKobo,
          currency: wallet.currency,
          status: WalletWithdrawalStatus.Pending,
          provider: PaymentProvider.Strowallet,
          providerReference: `wallet_withdrawal_${randomUUID()}`,
          destinationBankCode: dto.destinationBankCode.trim(),
          destinationBankName: dto.destinationBankName.trim(),
          destinationAccountNumber: dto.destinationAccountNumber.trim(),
          destinationAccountName: dto.destinationAccountName.trim(),
          narration: dto.narration?.trim() ?? 'Auction wallet withdrawal',
        }),
      );

      await manager.save(wallet);
      await this.writeLedger(manager, wallet, {
        type: WalletLedgerType.WithdrawalRequested,
        amountKobo: -dto.amountKobo,
        balanceBeforeKobo,
        reference: withdrawal.providerReference,
        metadata: { withdrawalId: withdrawal.id },
      });

      return withdrawal;
    });
  }

  private async refundWithdrawal(
    manager: EntityManager,
    withdrawal: WalletWithdrawal,
    payload: Record<string, unknown>,
  ) {
    if (
      [WalletWithdrawalStatus.Failed, WalletWithdrawalStatus.Reversed].includes(
        withdrawal.status,
      )
    ) {
      return { withdrawal, refunded: false };
    }

    const wallet = await this.findWalletForUpdate(manager, withdrawal.walletId);
    const balanceBeforeKobo = wallet.balanceKobo;
    wallet.balanceKobo += withdrawal.amountKobo;
    withdrawal.status = WalletWithdrawalStatus.Failed;
    withdrawal.failedAt = new Date();
    withdrawal.providerPayload = payload;

    await manager.save(wallet);
    await manager.save(withdrawal);
    await this.writeLedger(manager, wallet, {
      type: WalletLedgerType.WithdrawalFailed,
      amountKobo: withdrawal.amountKobo,
      balanceBeforeKobo,
      reference: `${withdrawal.providerReference}_failed`,
      metadata: { withdrawalId: withdrawal.id },
    });

    return { withdrawal, refunded: true };
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

  private async findWithdrawalForUpdate(
    manager: EntityManager,
    providerReference: string,
  ) {
    const withdrawal = await manager.findOne(WalletWithdrawal, {
      where: { providerReference },
      lock: { mode: 'pessimistic_write' },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    return withdrawal;
  }

  private async findAuthorizableWithdrawal(withdrawalId: string) {
    const withdrawal = await this.withdrawalsRepository.findOneBy({
      id: withdrawalId,
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (
      [WalletWithdrawalStatus.Completed, WalletWithdrawalStatus.Failed].includes(
        withdrawal.status,
      )
    ) {
      throw new BadRequestException('Withdrawal cannot be authorized');
    }

    return withdrawal;
  }

  private toWithdrawalStatus(status: string) {
    if (['SUCCESS', 'COMPLETED', 'SUCCESSFUL'].includes(status)) {
      return WalletWithdrawalStatus.Completed;
    }

    if (['FAILED', 'REVERSED'].includes(status)) {
      return WalletWithdrawalStatus.Failed;
    }

    return WalletWithdrawalStatus.Processing;
  }

  private readNameEnquiryReference(payload: Record<string, unknown>) {
    const reference =
      this.readOptionalString(payload, 'name_enquiry_reference') ??
      this.readOptionalString(payload, 'nameEnquiryReference') ??
      this.readOptionalString(payload, 'reference') ??
      this.readOptionalString(payload, 'sessionId') ??
      this.readOptionalString(payload, 'session_id');

    if (!reference) {
      throw new BadRequestException('Strowallet name enquiry reference missing');
    }

    return reference;
  }

  private readProviderStatus(payload: Record<string, unknown>) {
    return (
      this.readOptionalString(payload, 'status') ??
      this.readOptionalString(payload, 'transaction_status') ??
      this.readOptionalString(payload, 'transactionStatus') ??
      'PROCESSING'
    );
  }

  private readOptionalString(source: unknown, key: string) {
    if (!source || typeof source !== 'object') return null;
    const value = (source as Record<string, unknown>)[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private writeLedger(
    manager: EntityManager,
    wallet: Wallet,
    input: {
      type: WalletLedgerType;
      amountKobo: number;
      balanceBeforeKobo?: number;
      reference: string;
      metadata: Record<string, unknown>;
    },
  ) {
    const balanceBeforeKobo = input.balanceBeforeKobo ?? wallet.balanceKobo;

    return manager.save(
      manager.create(WalletLedgerEntry, {
        walletId: wallet.id,
        userId: wallet.userId,
        type: input.type,
        amountKobo: input.amountKobo,
        balanceBeforeKobo,
        balanceAfterKobo: wallet.balanceKobo,
        heldBeforeKobo: wallet.heldKobo,
        heldAfterKobo: wallet.heldKobo,
        reference: input.reference,
        metadata: input.metadata,
      }),
    );
  }
}
