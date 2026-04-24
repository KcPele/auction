import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentProvider } from '../../common/enums/payment-provider.enum';
import { OpayWebhookDto } from './dto/opay-webhook.dto';
import { PaymentWebhookEvent } from './entities/payment-webhook-event.entity';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentWebhookEvent)
    private readonly webhookEventsRepository: Repository<PaymentWebhookEvent>,
    private readonly walletsService: WalletsService,
  ) {}

  async handleOpayWebhook(dto: OpayWebhookDto) {
    const existing = await this.webhookEventsRepository.findOneBy({
      eventId: dto.eventId,
    });

    if (existing) {
      return { webhookEvent: existing, alreadyProcessed: true };
    }

    const payload = dto as unknown as Record<string, unknown>;
    const webhookEvent = await this.webhookEventsRepository.save(
      this.webhookEventsRepository.create({
        provider: PaymentProvider.Opay,
        eventId: dto.eventId,
        eventType: dto.eventType,
        payload,
      }),
    );

    const result = await this.processTopUp(dto, payload);
    webhookEvent.processedAt = new Date();

    return {
      webhookEvent: await this.webhookEventsRepository.save(webhookEvent),
      result,
      alreadyProcessed: false,
    };
  }

  private async processTopUp(
    dto: OpayWebhookDto,
    payload: Record<string, unknown>,
  ) {
    if (dto.status === 'SUCCESS') {
      return this.walletsService.confirmTopUpByReference(
        dto.providerReference,
        payload,
      );
    }

    if (dto.status === 'FAILED') {
      return this.walletsService.failTopUpByReference(
        dto.providerReference,
        payload,
      );
    }

    return { providerReference: dto.providerReference, status: dto.status };
  }
}
