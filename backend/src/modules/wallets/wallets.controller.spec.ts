import { Test } from '@nestjs/testing';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuthService } from '../auth/auth.service';
import type { CreateTopUpDto } from './dto/create-top-up.dto';
import { ListWalletLedgerQueryDto } from './dto/list-wallet-ledger-query.dto';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

describe('WalletsController', () => {
  const currentUser: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    role: UserRole.IndividualBidder,
    authRole: 'user',
    sessionId: 'session-id',
  };
  let controller: WalletsController;
  let service: {
    getWallet: jest.Mock;
    listLedger: jest.Mock;
    createTopUp: jest.Mock;
    getTopUp: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getWallet: jest.fn(),
      listLedger: jest.fn(),
      createTopUp: jest.fn(),
      getTopUp: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [
        { provide: WalletsService, useValue: service },
        { provide: AuthService, useValue: { getAuthenticatedUser: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(WalletsController);
  });

  it('gets current user wallet', async () => {
    service.getWallet.mockResolvedValue({ wallet: { userId: currentUser.id } });

    await expect(controller.getMe(currentUser)).resolves.toEqual({
      wallet: { userId: currentUser.id },
    });
    expect(service.getWallet).toHaveBeenCalledWith(currentUser.id);
  });

  it('lists current user ledger entries', async () => {
    const query = new ListWalletLedgerQueryDto();
    service.listLedger.mockResolvedValue({ ledgerEntries: [] });

    await expect(controller.listLedger(currentUser, query)).resolves.toEqual({
      ledgerEntries: [],
    });
    expect(service.listLedger).toHaveBeenCalledWith(currentUser.id, query);
  });

  it('creates a wallet top-up', async () => {
    const dto: CreateTopUpDto = { amountKobo: 500000 };
    service.createTopUp.mockResolvedValue({ topUp: dto });

    await expect(controller.createTopUp(currentUser, dto)).resolves.toEqual({
      topUp: dto,
    });
    expect(service.createTopUp).toHaveBeenCalledWith(currentUser.id, dto);
  });

  it('gets a wallet top-up', async () => {
    service.getTopUp.mockResolvedValue({ topUp: { id: 'top-up-id' } });

    await expect(controller.getTopUp(currentUser, 'top-up-id')).resolves.toEqual({
      topUp: { id: 'top-up-id' },
    });
    expect(service.getTopUp).toHaveBeenCalledWith(currentUser.id, 'top-up-id');
  });
});
