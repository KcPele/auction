import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
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

  async listBanks() {
    const response = await this.strowalletProvider.getBanks();
    const data = this.readObject(response, 'data') ?? response;
    const rawBanks = this.readArray(data, 'bank_list') ?? this.readArray(data, 'banks') ?? [];
    const banks = rawBanks
      .map((item) => {
        const code = this.readOptionalString(item, 'bankCode') ?? this.readOptionalString(item, 'bank_code') ?? this.readOptionalString(item, 'code');
        const name = this.readOptionalString(item, 'bankName') ?? this.readOptionalString(item, 'bank_name') ?? this.readOptionalString(item, 'name');
        return code && name ? { code, name } : null;
      })
      .filter((bank): bank is { code: string; name: string } => bank !== null);

    if (banks.length === 0) {
      throw new ServiceUnavailableException('Supported banks are temporarily unavailable');
    }

    return { banks };
  }

  async getAccountName(query: AccountNameQueryDto) {
    const response = await this.strowalletProvider.getAccountName({
      bankCode: query.bankCode,
      accountNumber: query.accountNumber,
    });
    const accountName = this.findNestedString(response, [
      'account_name',
      'accountName',
      'customer_name',
      'customerName',
    ]);
    const nameEnquiryReference = this.findNestedString(response, [
      'name_enquiry_reference',
      'nameEnquiryReference',
      'session_id',
      'sessionId',
      'reference',
    ]);

    if (!accountName) {
      throw new ServiceUnavailableException('Unable to resolve account');
    }

    return { accountName, nameEnquiryReference };
  }

  async handleStrowalletWebhook(dto: StrowalletWebhookDto, _rawPayload: string) {
    const eventId = this.getStrowalletEventId(dto);
    const existing = await this.webhookEventsRepository.findOneBy({
      eventId,
    });

    if (existing?.processedAt) {
      return { webhookEvent: existing, alreadyProcessed: true };
    }

    const payload = dto as unknown as Record<string, unknown>;
    const webhookEvent = existing
      ? Object.assign(existing, {
          eventType:
            this.readOptionalString(dto, 'event') ?? dto.type ?? null,
          payload,
        })
      : await this.webhookEventsRepository.save(
          this.webhookEventsRepository.create({
            provider: PaymentProvider.Strowallet,
            eventId,
            eventType:
              this.readOptionalString(dto, 'event') ?? dto.type ?? null,
            payload,
            processedAt: null,
          }),
        );

    const processing = await this.processStrowalletWebhook(dto, payload);
    webhookEvent.processedAt = processing.terminal ? new Date() : null;

    return {
      webhookEvent: await this.webhookEventsRepository.save(webhookEvent),
      result: processing.result,
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

      return {
        result:
          await this.walletWithdrawalsService.updateWithdrawalFromProvider(
            reference,
            status,
            payload,
          ),
        terminal: this.isTerminalTransferStatus(status),
      };
    }

    if (this.isSuccessfulCollection(dto)) {
      return {
        result: await this.walletFundingService.creditFundingAccount({
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
        }),
        terminal: true,
      };
    }

    const status =
      this.readOptionalString(dto, 'status') ??
      this.readOptionalString(dto, 'paymentStatus') ??
      this.readOptionalString(dto, 'transactionStatus') ??
      '';
    return {
      result: { eventType, ignored: true },
      terminal: ['FAILED', 'REVERSED', 'CANCELLED'].includes(
        status.toUpperCase(),
      ),
    };
  }

  private isTerminalTransferStatus(status: string) {
    return [
      'SUCCESS',
      'SUCCESSFUL',
      'COMPLETED',
      'FAILED',
      'REVERSED',
      'CANCELLED',
    ].includes(status.trim().toUpperCase());
  }

  private isSuccessfulCollection(dto: StrowalletWebhookDto) {
    const status =
      this.readOptionalString(dto, 'status') ??
      this.readOptionalString(dto, 'paymentStatus') ??
      this.readOptionalString(dto, 'transactionStatus') ??
      '';
    const type = String(dto.event ?? dto.type ?? 'credit').toUpperCase();

    return (
      ['SUCCESS', 'SUCCESSFUL', 'PAID', 'COMPLETED'].includes(
        status.toUpperCase(),
      ) && !type.includes('DEBIT')
    );
  }

  private getStrowalletEventId(dto: StrowalletWebhookDto) {
    const eventId =
      dto.sessionId ??
      this.readOptionalString(dto, 'reference') ??
      this.readOptionalString(dto, 'transactionReference') ??
      this.readOptionalString(dto, 'settlementId');

    if (!eventId) {
      throw new BadRequestException('Missing Strowallet event reference');
    }

    return eventId;
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

  private readObject(source: unknown, key: string) {
    if (!source || typeof source !== 'object') return null;
    const value = (source as Record<string, unknown>)[key];
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  private readArray(source: unknown, key: string) {
    if (!source || typeof source !== 'object') return null;
    const value = (source as Record<string, unknown>)[key];
    return Array.isArray(value) ? value : null;
  }

  private findNestedString(
    source: unknown,
    keys: string[],
    depth = 0,
  ): string | null {
    if (!source || typeof source !== 'object' || depth > 3) return null;
    for (const key of keys) {
      const value = this.readOptionalString(source, key);
      if (value) return value;
    }
    for (const value of Object.values(source as Record<string, unknown>)) {
      const nested = this.findNestedString(value, keys, depth + 1);
      if (nested) return nested;
    }
    return null;
  }
}
