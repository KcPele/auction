import { Test } from '@nestjs/testing';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuthService } from '../auth/auth.service';
import type { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ListWalletLedgerQueryDto } from './dto/list-wallet-ledger-query.dto';
import { WalletFundingService } from './wallet-funding.service';
import { WalletWithdrawalsService } from './wallet-withdrawals.service';
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
  };
  let fundingService: {
    getFundingAccount: jest.Mock;
  };
  let withdrawalsService: {
    createWithdrawal: jest.Mock;
    getWithdrawal: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getWallet: jest.fn(),
      listLedger: jest.fn(),
    };
    fundingService = {
      getFundingAccount: jest.fn(),
    };
    withdrawalsService = {
      createWithdrawal: jest.fn(),
      getWithdrawal: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [
        { provide: WalletsService, useValue: service },
        { provide: WalletFundingService, useValue: fundingService },
        { provide: WalletWithdrawalsService, useValue: withdrawalsService },
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

  it('creates or returns a Strowallet funding account', async () => {
    fundingService.getFundingAccount.mockResolvedValue({
      fundingAccount: { accountNumber: '6254727989' },
    });

    await expect(controller.getFundingAccount(currentUser)).resolves.toEqual({
      fundingAccount: { accountNumber: '6254727989' },
    });
    expect(fundingService.getFundingAccount).toHaveBeenCalledWith(currentUser.id);
  });

  it('creates a withdrawal', async () => {
    const dto: CreateWithdrawalDto = {
      amountKobo: 500000,
      destinationBankCode: '057',
      destinationBankName: 'Zenith Bank',
      destinationAccountNumber: '2085096393',
      destinationAccountName: 'Ada Lovelace',
    };
    withdrawalsService.createWithdrawal.mockResolvedValue({ withdrawal: dto });

    await expect(controller.createWithdrawal(currentUser, dto)).resolves.toEqual({
      withdrawal: dto,
    });
    expect(withdrawalsService.createWithdrawal).toHaveBeenCalledWith(
      currentUser.id,
      dto,
    );
  });

  it('gets a wallet withdrawal', async () => {
    withdrawalsService.getWithdrawal.mockResolvedValue({
      withdrawal: { id: 'withdrawal-id' },
    });

    await expect(
      controller.getWithdrawal(currentUser, 'withdrawal-id'),
    ).resolves.toEqual({
      withdrawal: { id: 'withdrawal-id' },
    });
    expect(withdrawalsService.getWithdrawal).toHaveBeenCalledWith(
      currentUser.id,
      'withdrawal-id',
    );
  });
});
