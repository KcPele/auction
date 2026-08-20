import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
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

  it('returns a stable supported-bank contract', async () => {
    strowalletProvider.getBanks.mockResolvedValue({
      success: true,
      data: {
        bank_list: [
          { bankCode: '000014', bankName: 'Access Bank' },
          { bank_code: '000013', bank_name: 'GTBank' },
        ],
      },
    });

    await expect(service.listBanks()).resolves.toEqual({
      banks: [
        { code: '000014', name: 'Access Bank' },
        { code: '000013', name: 'GTBank' },
      ],
    });
  });

  it('returns a stable account-name contract from nested provider data', async () => {
    strowalletProvider.getAccountName.mockResolvedValue({
      data: {
        account_name: 'Ada Lovelace',
        name_enquiry_reference: 'enquiry-reference',
      },
    });

    await expect(
      service.getAccountName({ bankCode: '000014', accountNumber: '0123456789' }),
    ).resolves.toEqual({
      accountName: 'Ada Lovelace',
      nameEnquiryReference: 'enquiry-reference',
    });
  });

  it('rejects an empty bank response instead of exposing provider data', async () => {
    strowalletProvider.getBanks.mockResolvedValue({ data: { bank_list: [] } });
    await expect(service.listBanks()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
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

  it('rejects funding webhooks without a stable event reference', async () => {
    await expect(
      service.handleStrowalletWebhook(
        { accountReference: 'wallet_user-id', amount: 5000, status: 'SUCCESS' },
        '{}',
      ),
    ).rejects.toThrow('Missing Strowallet event reference');
    expect(walletFundingService.creditFundingAccount).not.toHaveBeenCalled();
  });

  it('does not credit a collection without an explicit success status', async () => {
    const dto: StrowalletWebhookDto = {
      accountReference: 'wallet_user-id',
      sessionId: 'session-id',
      amount: 5000,
    };
    webhookEventsRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.handleStrowalletWebhook(dto, JSON.stringify(dto)),
    ).resolves.toEqual(
      expect.objectContaining({ result: expect.objectContaining({ ignored: true }) }),
    );
    expect(walletFundingService.creditFundingAccount).not.toHaveBeenCalled();
  });

  it('does not process duplicate webhook events twice', async () => {
    webhookEventsRepository.findOneBy.mockResolvedValue({
      id: 'event-id',
      processedAt: new Date(),
    });

    await expect(
      service.handleStrowalletWebhook(
        createCollectionWebhook(),
        '{}',
      ),
    ).resolves.toEqual({
      webhookEvent: expect.objectContaining({ id: 'event-id' }),
      alreadyProcessed: true,
    });
    expect(walletFundingService.creditFundingAccount).not.toHaveBeenCalled();
  });

  it('retries a previously stored webhook that did not finish processing', async () => {
    const dto = createCollectionWebhook();
    const webhookEvent = {
      id: 'event-id',
      eventId: 'session-id',
      payload: dto,
      processedAt: null,
    };
    webhookEventsRepository.findOneBy.mockResolvedValue(webhookEvent);
    walletFundingService.creditFundingAccount.mockResolvedValue({
      alreadyProcessed: false,
    });

    await expect(
      service.handleStrowalletWebhook(dto, JSON.stringify(dto)),
    ).resolves.toEqual(
      expect.objectContaining({
        alreadyProcessed: false,
        webhookEvent: expect.objectContaining({ processedAt: expect.any(Date) }),
      }),
    );
    expect(walletFundingService.creditFundingAccount).toHaveBeenCalledTimes(1);
  });

  it('processes a later terminal update that reuses a transfer reference', async () => {
    let storedEvent: Record<string, unknown> | null = null;
    webhookEventsRepository.findOneBy.mockImplementation(async () => storedEvent);
    webhookEventsRepository.save.mockImplementation(async (value) => {
      storedEvent = value;
      return value;
    });
    walletWithdrawalsService.updateWithdrawalFromProvider
      .mockResolvedValueOnce({ status: 'PROCESSING' })
      .mockResolvedValueOnce({ status: 'COMPLETED' });

    const processing: StrowalletWebhookDto = {
      type: 'transfer',
      transactionReference: 'wallet_withdrawal_reference',
      status: 'PROCESSING',
    };
    const completed = { ...processing, status: 'SUCCESS' };

    const first = await service.handleStrowalletWebhook(processing, '{}');
    const firstProcessedAt = first.webhookEvent.processedAt;
    const second = await service.handleStrowalletWebhook(completed, '{}');

    expect(firstProcessedAt).toBeNull();
    expect(second.webhookEvent.processedAt).toEqual(expect.any(Date));
    expect(
      walletWithdrawalsService.updateWithdrawalFromProvider,
    ).toHaveBeenCalledTimes(2);
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
