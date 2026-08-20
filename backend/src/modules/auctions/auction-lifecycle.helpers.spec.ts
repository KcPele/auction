import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { scheduleOpenLifecycleJobs } from './auction-lifecycle.helpers';

describe('auction lifecycle helpers', () => {
  it('restores scheduled, live, and payment-deadline jobs on bootstrap', async () => {
    const scheduled = { id: 'scheduled', status: AuctionStatus.Scheduled };
    const live = { id: 'live', status: AuctionStatus.Live };
    const awaiting = {
      id: 'awaiting',
      status: AuctionStatus.AwaitingPayment,
      paymentDeadlineAt: new Date(),
    };
    const repository = {
      find: jest.fn().mockResolvedValue([scheduled, live, awaiting]),
    };
    const scheduler = {
      scheduleAuctionLifecycle: jest.fn(),
      schedulePaymentDeadline: jest.fn(),
    };

    await scheduleOpenLifecycleJobs(repository as never, scheduler as never);

    expect(scheduler.scheduleAuctionLifecycle).toHaveBeenCalledTimes(2);
    expect(scheduler.schedulePaymentDeadline).toHaveBeenCalledWith(awaiting);
  });
});
