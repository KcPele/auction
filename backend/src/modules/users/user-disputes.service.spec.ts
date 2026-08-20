import { BadRequestException } from '@nestjs/common';
import { AuctionStatus } from '../../common/enums/auction-status.enum';
import { UserDisputesService } from './user-disputes.service';

describe('UserDisputesService', () => {
  const auction = {
    id: 'auction-id',
    status: AuctionStatus.Settled,
    winnerId: 'buyer-id',
    sellerId: 'seller-id',
    currentWinningBidId: 'bid-id',
  };
  let disputes: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let auctions: { findOneBy: jest.Mock };
  let bids: { findOneBy: jest.Mock };
  let notifications: { create: jest.Mock };
  let service: UserDisputesService;

  beforeEach(() => {
    disputes = {
      find: jest.fn(),
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 'dispute-id', ...value })),
    };
    auctions = { findOneBy: jest.fn().mockResolvedValue(auction) };
    bids = { findOneBy: jest.fn().mockResolvedValue({ amountKobo: 7_000_000 }) };
    notifications = { create: jest.fn() };
    service = new UserDisputesService(
      disputes as never,
      auctions as never,
      bids as never,
      notifications as never,
    );
  });

  it('creates a dispute for the auction buyer and notifies admins', async () => {
    await expect(
      service.create('buyer-id', {
        auctionId: auction.id,
        reason: 'The item did not match the listing.',
      }),
    ).resolves.toEqual({
      dispute: expect.objectContaining({
        id: 'dispute-id',
        buyerId: 'buyer-id',
        sellerId: 'seller-id',
        amountKobo: '7000000',
      }),
    });
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ auctionId: auction.id }) }),
    );
  });

  it('rejects users who did not participate in the auction', async () => {
    await expect(
      service.create('stranger-id', {
        auctionId: auction.id,
        reason: 'I should not be allowed to open this dispute.',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
