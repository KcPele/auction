import { DisputeStatus } from '../../common/enums/dispute-status.enum';
import { AdminDisputesService } from './admin-disputes.service';

describe('AdminDisputesService listing', () => {
  it('returns one requested page while preserving the filtered total', async () => {
    const repository = {
      findAndCount: jest.fn().mockResolvedValue([[{ id: 'dispute-id' }], 47]),
    };
    const service = new AdminDisputesService(repository as never, {
      create: jest.fn(),
    } as never);

    await expect(
      service.listDisputes({
        status: DisputeStatus.Open,
        limit: 20,
        offset: 20,
      }),
    ).resolves.toEqual({ items: [{ id: 'dispute-id' }], total: 47 });

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { status: DisputeStatus.Open },
      order: { createdAt: 'DESC' },
      take: 20,
      skip: 20,
    });
  });

  it('notifies buyer and seller when resolving a dispute', async () => {
    const dispute = {
      id: 'dispute-id',
      auctionId: 'auction-id',
      buyerId: 'buyer-id',
      sellerId: 'seller-id',
      status: DisputeStatus.Investigating,
      resolution: null,
    };
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(dispute),
      save: jest.fn(async (value) => value),
    };
    const notifications = { create: jest.fn() };
    const service = new AdminDisputesService(
      repository as never,
      notifications as never,
    );

    await service.resolveDispute('admin-id', dispute.id, {
      resolution: 'Refund approved',
    });

    expect(notifications.create).toHaveBeenCalledTimes(2);
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'buyer-id' }),
    );
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'seller-id' }),
    );
  });
});
