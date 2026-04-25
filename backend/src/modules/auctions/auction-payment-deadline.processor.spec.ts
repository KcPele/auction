import { PaymentDeadlineJobNames } from '../../common/constants/auction-lifecycle-jobs';
import type { AuctionSettlementService } from './auction-settlement.service';
import { AuctionPaymentDeadlineProcessor } from './auction-payment-deadline.processor';

describe('AuctionPaymentDeadlineProcessor', () => {
  let settlementService: { defaultAuctionPayment: jest.Mock };
  let processor: AuctionPaymentDeadlineProcessor;

  beforeEach(() => {
    settlementService = { defaultAuctionPayment: jest.fn() };
    processor = new AuctionPaymentDeadlineProcessor(
      settlementService as unknown as AuctionSettlementService,
    );
  });

  it('defaults unpaid auction payments', async () => {
    await processor.process({
      name: PaymentDeadlineJobNames.Forfeit,
      data: { auctionId: 'auction-id' },
    } as never);

    expect(settlementService.defaultAuctionPayment).toHaveBeenCalledWith(
      'auction-id',
    );
  });
});
