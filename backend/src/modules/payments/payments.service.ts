import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentProvider } from '../../common/enums/payment-provider.enum';
import { AccountNameQueryDto } from './dto/account-name-query.dto';
import { StrowalletWebhookDto } from './dto/strowallet-webhook.dto';
import { PaymentWebhookEvent } from './entities/payment-webhook-event.entity';
import { WalletFundingService } from '../wallets/wallet-funding.service';
import { WalletWithdrawalsService } from '../wallets/wallet-withdrawals.service';
import { StrowalletProvider } from './providers/strowallet.provider';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentWebhookEvent)
    private readonly webhookEventsRepository: Repository<PaymentWebhookEvent>,
    private readonly walletFundingService: WalletFundingService,
    private readonly walletWithdrawalsService: WalletWithdrawalsService,
    private readonly strowalletProvider: StrowalletProvider,
  ) {}

  listBanks() {
    return this.strowalletProvider.getBanks();
  }

  getAccountName(query: AccountNameQueryDto) {
    return this.strowalletProvider.getAccountName({
      bankCode: query.bankCode,
      accountNumber: query.accountNumber,
    });
  }

  async handleStrowalletWebhook(dto: StrowalletWebhookDto, rawPayload: string) {
    const eventId = this.getStrowalletEventId(dto);
    const existing = await this.webhookEventsRepository.findOneBy({
      eventId,
    });

    if (existing) {
      return { webhookEvent: existing, alreadyProcessed: true };
    }

    const payload = dto as unknown as Record<string, unknown>;
    const webhookEvent = await this.webhookEventsRepository.save(
      this.webhookEventsRepository.create({
        provider: PaymentProvider.Strowallet,
        eventId,
        eventType: this.readOptionalString(dto, 'event') ?? dto.type ?? null,
        payload,
      }),
    );

    const result = await this.processStrowalletWebhook(dto, payload);
    webhookEvent.processedAt = new Date();

    return {
      webhookEvent: await this.webhookEventsRepository.save(webhookEvent),
      result,
      alreadyProcessed: false,
    };
  }

  private async processStrowalletWebhook(
    dto: StrowalletWebhookDto,
    payload: Record<string, unknown>,
  ) {
    const eventType = String(dto.event ?? dto.type ?? '').toUpperCase();
    if (eventType.includes('DISBURSEMENT') || eventType.includes('TRANSFER')) {
      const reference =
        this.readOptionalString(dto, 'reference') ??
        this.readString(dto, 'transactionReference');
      const status =
        this.readOptionalString(dto, 'status') ??
        this.readOptionalString(dto, 'transactionStatus') ??
        this.readString(dto, 'paymentStatus');

      return this.walletWithdrawalsService.updateWithdrawalFromProvider(
        reference,
        status,
        payload,
      );
    }

    if (this.isSuccessfulCollection(dto)) {
      return this.walletFundingService.creditFundingAccount({
        accountReference:
          this.readOptionalString(dto, 'accountReference') ?? undefined,
        accountNumber:
          dto.accountNumber ??
          this.readOptionalString(dto, 'destinationAccountNumber') ??
          this.readOptionalString(dto, 'beneficiaryAccountNumber') ??
          undefined,
        amountKobo: this.toKobo(this.readAmount(dto)),
        reference: this.getStrowalletEventId(dto),
        metadata: payload,
      });
    }

    return { eventType, ignored: true };
  }

  private isSuccessfulCollection(dto: StrowalletWebhookDto) {
    const status =
      this.readOptionalString(dto, 'status') ??
      this.readOptionalString(dto, 'paymentStatus') ??
      this.readOptionalString(dto, 'transactionStatus') ??
      'SUCCESS';
    const type = String(dto.event ?? dto.type ?? 'credit').toUpperCase();

    return (
      ['SUCCESS', 'SUCCESSFUL', 'PAID', 'COMPLETED'].includes(
        status.toUpperCase(),
      ) && !type.includes('DEBIT')
    );
  }

  private getStrowalletEventId(dto: StrowalletWebhookDto) {
    return (
      dto.sessionId ??
      this.readOptionalString(dto, 'reference') ??
      this.readOptionalString(dto, 'transactionReference') ??
      this.readOptionalString(dto, 'settlementId') ??
      `strowallet:${Date.now()}`
    );
  }

  private toKobo(amount: number) {
    return Math.round(amount * 100);
  }

  private readAmount(source: Record<string, unknown>) {
    const raw =
      source.amount ??
      source.transactionAmount ??
      source.settledAmount ??
      source.amountPaid;

    const amount = Number(raw);
    if (!Number.isFinite(amount)) {
      throw new BadRequestException('Invalid Strowallet amount');
    }

    return amount;
  }

  private readString(source: unknown, key: string) {
    const value = this.readOptionalString(source, key);

    if (!value) {
      throw new BadRequestException(`Missing Strowallet ${key}`);
    }

    return value;
  }

  private readOptionalString(source: unknown, key: string) {
    if (!source || typeof source !== 'object') {
      return null;
    }

    const value = (source as Record<string, unknown>)[key];

    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
}
