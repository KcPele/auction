import { PaymentProvider } from '../../common/enums/payment-provider.enum';
import type { WalletsService } from '../wallets/wallets.service';
import type { OpayWebhookDto } from './dto/opay-webhook.dto';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let webhookEventsRepository: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let walletsService: {
    confirmTopUpByReference: jest.Mock;
    failTopUpByReference: jest.Mock;
  };
  let service: PaymentsService;

  beforeEach(() => {
    webhookEventsRepository = {
      findOneBy: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    walletsService = {
      confirmTopUpByReference: jest.fn(),
      failTopUpByReference: jest.fn(),
    };
    service = new PaymentsService(
      webhookEventsRepository as never,
      walletsService as unknown as WalletsService,
    );
  });

  it('confirms wallet top-ups from successful OPay webhooks', async () => {
    const dto = createWebhookDto('SUCCESS');
    webhookEventsRepository.findOneBy.mockResolvedValue(null);
    walletsService.confirmTopUpByReference.mockResolvedValue({
      alreadyProcessed: false,
    });

    await expect(service.handleOpayWebhook(dto)).resolves.toEqual({
      webhookEvent: expect.objectContaining({
        provider: PaymentProvider.Opay,
        eventId: dto.eventId,
        processedAt: expect.any(Date),
      }),
      result: { alreadyProcessed: false },
      alreadyProcessed: false,
    });
    expect(walletsService.confirmTopUpByReference).toHaveBeenCalledWith(
      dto.providerReference,
      dto,
    );
  });

  it('marks wallet top-ups failed from failed OPay webhooks', async () => {
    const dto = createWebhookDto('FAILED');
    webhookEventsRepository.findOneBy.mockResolvedValue(null);
    walletsService.failTopUpByReference.mockResolvedValue({
      alreadyProcessed: false,
    });

    await service.handleOpayWebhook(dto);

    expect(walletsService.failTopUpByReference).toHaveBeenCalledWith(
      dto.providerReference,
      dto,
    );
  });

  it('does not process duplicate webhook events twice', async () => {
    webhookEventsRepository.findOneBy.mockResolvedValue({ id: 'event-id' });

    await expect(service.handleOpayWebhook(createWebhookDto())).resolves.toEqual({
      webhookEvent: { id: 'event-id' },
      alreadyProcessed: true,
    });
    expect(walletsService.confirmTopUpByReference).not.toHaveBeenCalled();
  });
});

function createWebhookDto(
  status: OpayWebhookDto['status'] = 'SUCCESS',
): OpayWebhookDto {
  return {
    eventId: 'event-id',
    eventType: 'PAYMENT_SUCCESS',
    providerReference: 'wallet_topup_reference',
    status,
  };
}
