import { Test } from '@nestjs/testing';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuthService } from '../auth/auth.service';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';
import type { PlaceBidDto } from './dto/place-bid.dto';

describe('BidsController', () => {
  const currentUser: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    role: UserRole.IndividualBidder,
    authRole: 'user',
    sessionId: 'session-id',
  };
  let controller: BidsController;
  let service: { placeBid: jest.Mock };

  beforeEach(async () => {
    service = { placeBid: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [BidsController],
      providers: [
        { provide: BidsService, useValue: service },
        { provide: AuthService, useValue: { getAuthenticatedUser: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(BidsController);
  });

  it('places a bid on an auction', async () => {
    const dto: PlaceBidDto = { amountKobo: 250000000 };
    service.placeBid.mockResolvedValue({ bid: { amountKobo: dto.amountKobo } });

    await expect(
      controller.placeBid(currentUser, 'auction-id', dto),
    ).resolves.toEqual({
      bid: { amountKobo: dto.amountKobo },
    });
    expect(service.placeBid).toHaveBeenCalledWith(
      currentUser.id,
      'auction-id',
      dto,
    );
  });
});
