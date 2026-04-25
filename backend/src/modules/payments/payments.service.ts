import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentProvider } from '../../common/enums/payment-provider.enum';
import { MonnifyWebhookDto } from './dto/monnify-webhook.dto';
import { PaymentWebhookEvent } from './entities/payment-webhook-event.entity';
import { WalletFundingService } from '../wallets/wallet-funding.service';
import { WalletWithdrawalsService } from '../wallets/wallet-withdrawals.service';
import { MonnifyProvider } from './providers/monnify.provider';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentWebhookEvent)
    private readonly webhookEventsRepository: Repository<PaymentWebhookEvent>,
    private readonly walletFundingService: WalletFundingService,
    private readonly walletWithdrawalsService: WalletWithdrawalsService,
    private readonly monnifyProvider: MonnifyProvider,
  ) {}

  async handleMonnifyWebhook(
    dto: MonnifyWebhookDto,
    signature: string | undefined,
    rawPayload: string,
  ) {
    if (!this.monnifyProvider.verifyWebhookSignature(rawPayload, signature)) {
      throw new BadRequestException('Invalid Monnify signature');
    }

    const eventId = this.getMonnifyEventId(dto);
    const existing = await this.webhookEventsRepository.findOneBy({
      eventId,
    });

    if (existing) {
      return { webhookEvent: existing, alreadyProcessed: true };
    }

    const payload = dto as unknown as Record<string, unknown>;
    const webhookEvent = await this.webhookEventsRepository.save(
      this.webhookEventsRepository.create({
        provider: PaymentProvider.Monnify,
        eventId,
        eventType: dto.eventType,
        payload,
      }),
    );

    const result = await this.processMonnifyWebhook(dto, payload);
    webhookEvent.processedAt = new Date();

    return {
      webhookEvent: await this.webhookEventsRepository.save(webhookEvent),
      result,
      alreadyProcessed: false,
    };
  }

  private async processMonnifyWebhook(
    dto: MonnifyWebhookDto,
    payload: Record<string, unknown>,
  ) {
    const eventData = dto.eventData;

    if (this.isSuccessfulCollection(dto)) {
      return this.walletFundingService.creditFundingAccount({
        accountReference: this.readString(eventData.product, 'reference'),
        amountKobo: this.toKobo(this.readNumber(eventData, 'amountPaid')),
        reference: this.getMonnifyEventId(dto),
        metadata: payload,
      });
    }

    if (dto.eventType.toUpperCase().includes('DISBURSEMENT')) {
      const reference =
        this.readOptionalString(eventData, 'reference') ??
        this.readString(eventData, 'transactionReference');
      const status =
        this.readOptionalString(eventData, 'status') ??
        this.readOptionalString(eventData, 'transactionStatus') ??
        this.readString(eventData, 'paymentStatus');

      return this.walletWithdrawalsService.updateWithdrawalFromProvider(
        reference,
        status,
        payload,
      );
    }

    return { eventType: dto.eventType, ignored: true };
  }

  private isSuccessfulCollection(dto: MonnifyWebhookDto) {
    return (
      dto.eventType === 'SUCCESSFUL_TRANSACTION' &&
      this.readString(dto.eventData, 'paymentStatus') === 'PAID'
    );
  }

  private getMonnifyEventId(dto: MonnifyWebhookDto) {
    return (
      this.readOptionalString(dto.eventData, 'transactionReference') ??
      this.readOptionalString(dto.eventData, 'paymentReference') ??
      `${dto.eventType}:${Date.now()}`
    );
  }

  private toKobo(amount: number) {
    return Math.round(amount * 100);
  }

  private readNumber(source: Record<string, unknown>, key: string) {
    const value = source[key];
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      throw new BadRequestException(`Invalid Monnify ${key}`);
    }

    return numberValue;
  }

  private readString(source: unknown, key: string) {
    const value = this.readOptionalString(source, key);

    if (!value) {
      throw new BadRequestException(`Missing Monnify ${key}`);
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
