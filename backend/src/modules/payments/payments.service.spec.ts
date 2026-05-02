import { BadRequestException } from '@nestjs/common';
import { PaymentProvider } from '../../common/enums/payment-provider.enum';
import type { WalletFundingService } from '../wallets/wallet-funding.service';
import type { WalletWithdrawalsService } from '../wallets/wallet-withdrawals.service';
import type { StrowalletWebhookDto } from './dto/strowallet-webhook.dto';
import type { StrowalletProvider } from './providers/strowallet.provider';
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
  let strowalletProvider: {
    getBanks: jest.Mock;
    getAccountName: jest.Mock;
  };
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
    strowalletProvider = {
      getBanks: jest.fn(),
      getAccountName: jest.fn(),
    };
    service = new PaymentsService(
      webhookEventsRepository as never,
      walletFundingService as unknown as WalletFundingService,
      walletWithdrawalsService as unknown as WalletWithdrawalsService,
      strowalletProvider as unknown as StrowalletProvider,
    );
  });

  it('credits wallet funding from successful Strowallet webhooks', async () => {
    const dto = createCollectionWebhook();
    webhookEventsRepository.findOneBy.mockResolvedValue(null);
    walletFundingService.creditFundingAccount.mockResolvedValue({
      alreadyProcessed: false,
    });

    await expect(
      service.handleStrowalletWebhook(dto, JSON.stringify(dto)),
    ).resolves.toEqual({
      webhookEvent: expect.objectContaining({
        provider: PaymentProvider.Strowallet,
        eventId: 'session-id',
        processedAt: expect.any(Date),
      }),
      result: { alreadyProcessed: false },
      alreadyProcessed: false,
    });
    expect(walletFundingService.creditFundingAccount).toHaveBeenCalledWith({
      accountReference: 'wallet_user-id',
      amountKobo: 500000,
      reference: 'session-id',
      metadata: dto,
    });
  });

  it('updates withdrawals from Strowallet transfer webhooks', async () => {
    const dto: StrowalletWebhookDto = {
      type: 'transfer',
      transactionReference: 'wallet_withdrawal_reference',
      status: 'SUCCESS',
    };
    webhookEventsRepository.findOneBy.mockResolvedValue(null);
    walletWithdrawalsService.updateWithdrawalFromProvider.mockResolvedValue({
      id: 'withdrawal-id',
    });

    await service.handleStrowalletWebhook(dto, JSON.stringify(dto));

    expect(
      walletWithdrawalsService.updateWithdrawalFromProvider,
    ).toHaveBeenCalledWith(
      'wallet_withdrawal_reference',
      'SUCCESS',
      dto,
    );
  });

  it('rejects funding webhooks without an amount', async () => {
    await expect(
      service.handleStrowalletWebhook({ accountReference: 'wallet_user-id' }, '{}'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not process duplicate webhook events twice', async () => {
    webhookEventsRepository.findOneBy.mockResolvedValue({ id: 'event-id' });

    await expect(
      service.handleStrowalletWebhook(
        createCollectionWebhook(),
        '{}',
      ),
    ).resolves.toEqual({
      webhookEvent: { id: 'event-id' },
      alreadyProcessed: true,
    });
    expect(walletFundingService.creditFundingAccount).not.toHaveBeenCalled();
  });
});

function createCollectionWebhook(): StrowalletWebhookDto {
  return {
    accountReference: 'wallet_user-id',
    sessionId: 'session-id',
    status: 'SUCCESS',
    amount: 5000,
  };
}
