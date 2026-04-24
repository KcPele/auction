import { Test } from '@nestjs/testing';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuthService } from '../auth/auth.service';
import { AuctionsController } from './auctions.controller';
import { AuctionsService } from './auctions.service';
import type { CancelAuctionDto } from './dto/cancel-auction.dto';
import { ListAuctionsQueryDto } from './dto/list-auctions-query.dto';

describe('AuctionsController', () => {
  const admin: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    role: UserRole.Admin,
    authRole: 'admin',
    sessionId: 'session-id',
  };
  let controller: AuctionsController;
  let service: {
    list: jest.Mock;
    findOne: jest.Mock;
    listBids: jest.Mock;
    cancel: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      list: jest.fn(),
      findOne: jest.fn(),
      listBids: jest.fn(),
      cancel: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AuctionsController],
      providers: [
        { provide: AuctionsService, useValue: service },
        { provide: AuthService, useValue: { getAuthenticatedUser: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(AuctionsController);
  });

  it('lists auctions', async () => {
    const query = new ListAuctionsQueryDto();
    service.list.mockResolvedValue({ auctions: [] });

    await expect(controller.list(query)).resolves.toEqual({ auctions: [] });
    expect(service.list).toHaveBeenCalledWith(query);
  });

  it('gets an auction by id', async () => {
    service.findOne.mockResolvedValue({ auction: { id: 'auction-id' } });

    await expect(controller.findOne('auction-id')).resolves.toEqual({
      auction: { id: 'auction-id' },
    });
    expect(service.findOne).toHaveBeenCalledWith('auction-id');
  });

  it('lists auction bids', async () => {
    service.listBids.mockResolvedValue({ bids: [] });

    await expect(controller.listBids('auction-id')).resolves.toEqual({
      bids: [],
    });
    expect(service.listBids).toHaveBeenCalledWith('auction-id');
  });

  it('cancels an auction', async () => {
    const dto: CancelAuctionDto = { reason: 'Inspection issue' };
    service.cancel.mockResolvedValue({ auction: { status: 'CANCELLED' } });

    await expect(controller.cancel(admin, 'auction-id', dto)).resolves.toEqual({
      auction: { status: 'CANCELLED' },
    });
    expect(service.cancel).toHaveBeenCalledWith(admin.id, 'auction-id', dto);
  });
});
