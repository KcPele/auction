import { DeliveryStatus } from '../../common/enums/delivery-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { UsersService } from './users.service';

describe('UsersService deliveries', () => {
  it('lists a seller delivery with its auction title and role', async () => {
    const delivery = {
      auctionId: 'auction-id',
      winnerId: 'buyer-id',
      sellerId: 'seller-id',
      status: DeliveryStatus.PaymentConfirmed,
      trackingInfo: null,
      updatedAt: new Date('2026-08-10T18:10:01.000Z'),
    };
    const deliveryRepository = {
      find: jest.fn().mockResolvedValue([delivery]),
    };
    const auctionsRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'auction-id',
          listingId: 'listing-id',
          category: ListingCategory.Car,
        },
      ]),
    };
    const carListingsRepository = {
      find: jest.fn().mockResolvedValue([
        { id: 'listing-id', make: 'Toyota', model: 'Land Cruiser', year: 2022 },
      ]),
    };
    const service = new UsersService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      auctionsRepository as never,
      carListingsRepository as never,
      {} as never,
      {} as never,
      deliveryRepository as never,
    );

    await expect(service.listDeliveries('seller-id')).resolves.toEqual({
      items: [
        expect.objectContaining({
          auctionId: 'auction-id',
          title: 'Toyota Land Cruiser 2022',
          role: 'SELLER',
          status: DeliveryStatus.PaymentConfirmed,
        }),
      ],
    });
  });
});
