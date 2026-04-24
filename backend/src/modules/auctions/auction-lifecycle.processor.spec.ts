import { AuctionLifecycleJobNames } from '../../common/constants/auction-lifecycle-jobs';
import { AuctionLifecycleProcessor } from './auction-lifecycle.processor';
import type { AuctionsService } from './auctions.service';

describe('AuctionLifecycleProcessor', () => {
  let auctionsService: {
    startScheduledAuction: jest.Mock;
    closeAuction: jest.Mock;
  };
  let processor: AuctionLifecycleProcessor;

  beforeEach(() => {
    auctionsService = {
      startScheduledAuction: jest.fn(),
      closeAuction: jest.fn(),
    };
    processor = new AuctionLifecycleProcessor(
      auctionsService as unknown as AuctionsService,
    );
  });

  it('starts scheduled auctions', async () => {
    await processor.process({
      name: AuctionLifecycleJobNames.Start,
      data: { auctionId: 'auction-id' },
    } as never);

    expect(auctionsService.startScheduledAuction).toHaveBeenCalledWith(
      'auction-id',
    );
  });

  it('closes ended auctions', async () => {
    await processor.process({
      name: AuctionLifecycleJobNames.Close,
      data: { auctionId: 'auction-id' },
    } as never);

    expect(auctionsService.closeAuction).toHaveBeenCalledWith('auction-id');
  });
});
