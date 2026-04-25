import { Test } from '@nestjs/testing';
import type { MonnifyWebhookDto } from './dto/monnify-webhook.dto';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: { handleMonnifyWebhook: jest.Mock };

  beforeEach(async () => {
    service = { handleMonnifyWebhook: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: service }],
    }).compile();

    controller = moduleRef.get(PaymentsController);
  });

  it('accepts a Monnify webhook', async () => {
    const dto: MonnifyWebhookDto = {
      eventType: 'SUCCESSFUL_TRANSACTION',
      eventData: {
        transactionReference: 'MNFY|reference',
        paymentStatus: 'PAID',
      },
    };
    service.handleMonnifyWebhook.mockResolvedValue({ alreadyProcessed: false });

    await expect(
      controller.handleMonnifyWebhook(dto, 'signature', {
        rawBody: JSON.stringify(dto),
      }),
    ).resolves.toEqual({
      alreadyProcessed: false,
    });
    expect(service.handleMonnifyWebhook).toHaveBeenCalledWith(
      dto,
      'signature',
      JSON.stringify(dto),
    );
  });
});
