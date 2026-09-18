import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { UsersService } from './users.service';

describe('UsersService watchlist notifications', () => {
  it('confirms that a saved scheduled auction will be reminded', async () => {
    const auction = {
      id: 'auction-id',
      status: AuctionStatus.Scheduled,
      category: ListingCategory.Car,
      startTime: new Date(Date.now() + 60 * 60_000),
    };
    const auctions = { findOneBy: jest.fn().mockResolvedValue(auction) };
    const watchlist = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => ({ id: 'watch-id', createdAt: new Date(), ...value })),
      save: jest.fn(async (value) => value),
    };
    const notifications = { create: jest.fn().mockResolvedValue({}) };
    const service = new UsersService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      auctions as never,
      {} as never,
      {} as never,
      watchlist as never,
      {} as never,
      notifications as never,
    );

    await service.addWatchlist('user-id', auction.id);

    expect(notifications.create).toHaveBeenCalledWith({
      audience: 'USER',
      recipientId: 'user-id',
      type: 'SYSTEM',
      title: 'Reminder set',
      message: "We'll notify you 15 minutes before this auction starts.",
      data: { auctionId: auction.id, source: 'WATCHLIST_SAVED' },
    });
  });
});
