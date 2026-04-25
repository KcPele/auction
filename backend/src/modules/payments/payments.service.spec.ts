import { BadRequestException } from '@nestjs/common';
import { PaymentProvider } from '../../common/enums/payment-provider.enum';
import type { WalletFundingService } from '../wallets/wallet-funding.service';
import type { WalletWithdrawalsService } from '../wallets/wallet-withdrawals.service';
import type { MonnifyWebhookDto } from './dto/monnify-webhook.dto';
import type { MonnifyProvider } from './providers/monnify.provider';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let webhookEventsRepository: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let walletFundingService: {
    creditFundingAccount: jest.Mock;
  };
  let walletWithdrawalsService: {
    updateWithdrawalFromProvider: jest.Mock;
  };
  let monnifyProvider: { verifyWebhookSignature: jest.Mock };
  let service: PaymentsService;

  beforeEach(() => {
    webhookEventsRepository = {
      findOneBy: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    walletFundingService = {
      creditFundingAccount: jest.fn(),
    };
    walletWithdrawalsService = {
      updateWithdrawalFromProvider: jest.fn(),
    };
    monnifyProvider = { verifyWebhookSignature: jest.fn().mockReturnValue(true) };
    service = new PaymentsService(
      webhookEventsRepository as never,
      walletFundingService as unknown as WalletFundingService,
      walletWithdrawalsService as unknown as WalletWithdrawalsService,
      monnifyProvider as unknown as MonnifyProvider,
    );
  });

  it('credits wallet funding from successful Monnify collection webhooks', async () => {
    const dto = createCollectionWebhook();
    webhookEventsRepository.findOneBy.mockResolvedValue(null);
    walletFundingService.creditFundingAccount.mockResolvedValue({
      alreadyProcessed: false,
    });

    await expect(
      service.handleMonnifyWebhook(dto, 'signature', JSON.stringify(dto)),
    ).resolves.toEqual({
      webhookEvent: expect.objectContaining({
        provider: PaymentProvider.Monnify,
        eventId: 'MNFY|reference',
        processedAt: expect.any(Date),
      }),
      result: { alreadyProcessed: false },
      alreadyProcessed: false,
    });
    expect(walletFundingService.creditFundingAccount).toHaveBeenCalledWith({
      accountReference: 'wallet_user-id',
      amountKobo: 500000,
      reference: 'MNFY|reference',
      metadata: dto,
    });
  });

  it('updates withdrawals from Monnify disbursement webhooks', async () => {
    const dto: MonnifyWebhookDto = {
      eventType: 'SUCCESSFUL_DISBURSEMENT',
      eventData: {
        transactionReference: 'wallet_withdrawal_reference',
        status: 'SUCCESS',
      },
    };
    webhookEventsRepository.findOneBy.mockResolvedValue(null);
    walletWithdrawalsService.updateWithdrawalFromProvider.mockResolvedValue({
      id: 'withdrawal-id',
    });

    await service.handleMonnifyWebhook(dto, 'signature', JSON.stringify(dto));

    expect(
      walletWithdrawalsService.updateWithdrawalFromProvider,
    ).toHaveBeenCalledWith(
      'wallet_withdrawal_reference',
      'SUCCESS',
      dto,
    );
  });

  it('rejects invalid Monnify signatures', async () => {
    monnifyProvider.verifyWebhookSignature.mockReturnValue(false);

    await expect(
      service.handleMonnifyWebhook(
        createCollectionWebhook(),
        'bad-signature',
        '{}',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not process duplicate webhook events twice', async () => {
    webhookEventsRepository.findOneBy.mockResolvedValue({ id: 'event-id' });

    await expect(
      service.handleMonnifyWebhook(
        createCollectionWebhook(),
        'signature',
        '{}',
      ),
    ).resolves.toEqual({
      webhookEvent: { id: 'event-id' },
      alreadyProcessed: true,
    });
    expect(walletFundingService.creditFundingAccount).not.toHaveBeenCalled();
  });
});

function createCollectionWebhook(): MonnifyWebhookDto {
  return {
    eventType: 'SUCCESSFUL_TRANSACTION',
    eventData: {
      product: { reference: 'wallet_user-id' },
      transactionReference: 'MNFY|reference',
      paymentReference: 'payment-reference',
      paymentStatus: 'PAID',
      amountPaid: 5000,
    },
  };
}
