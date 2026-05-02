import { Test } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import type { StrowalletWebhookDto } from './dto/strowallet-webhook.dto';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: {
    handleStrowalletWebhook: jest.Mock;
    listBanks: jest.Mock;
    getAccountName: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      handleStrowalletWebhook: jest.fn(),
      listBanks: jest.fn(),
      getAccountName: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: service },
        { provide: AuthService, useValue: { getAuthenticatedUser: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(PaymentsController);
  });

  it('accepts a Strowallet webhook', async () => {
    const dto: StrowalletWebhookDto = {
      sessionId: 'session-id',
      accountNumber: '96034733',
      amount: 5000,
    };
    service.handleStrowalletWebhook.mockResolvedValue({ alreadyProcessed: false });

    await expect(
      controller.handleStrowalletWebhook(dto, {
        rawBody: JSON.stringify(dto),
      }),
    ).resolves.toEqual({
      alreadyProcessed: false,
    });
    expect(service.handleStrowalletWebhook).toHaveBeenCalledWith(
      dto,
      JSON.stringify(dto),
    );
  });
});
