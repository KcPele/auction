import { Test } from '@nestjs/testing';
import type { OpayWebhookDto } from './dto/opay-webhook.dto';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: { handleOpayWebhook: jest.Mock };

  beforeEach(async () => {
    service = { handleOpayWebhook: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: service }],
    }).compile();

    controller = moduleRef.get(PaymentsController);
  });

  it('accepts an OPay webhook', async () => {
    const dto: OpayWebhookDto = {
      eventId: 'event-id',
      eventType: 'PAYMENT_SUCCESS',
      providerReference: 'wallet_topup_reference',
      status: 'SUCCESS',
    };
    service.handleOpayWebhook.mockResolvedValue({ alreadyProcessed: false });

    await expect(controller.handleOpayWebhook(dto)).resolves.toEqual({
      alreadyProcessed: false,
    });
    expect(service.handleOpayWebhook).toHaveBeenCalledWith(dto);
  });
});
