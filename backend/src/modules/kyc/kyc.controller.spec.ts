import { Test } from '@nestjs/testing';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuthService } from '../auth/auth.service';
import type { CreateSubaccountDto } from './dto/create-subaccount.dto';
import type { ConfirmBvnDto } from './dto/confirm-bvn.dto';
import type { VerifyBvnDto } from './dto/verify-bvn.dto';
import type { VerifyNinDto } from './dto/verify-nin.dto';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';

describe('KycController', () => {
  const currentUser: AuthenticatedUser = {
    id: 'user-id',
    role: UserRole.IndividualBidder,
    authRole: 'user',
    sessionId: 'session-id',
  };
  let controller: KycController;
  let service: {
    verifyBvn: jest.Mock;
    confirmBvn: jest.Mock;
    verifyNin: jest.Mock;
    getStatus: jest.Mock;
    createSubaccount: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      verifyBvn: jest.fn(),
      confirmBvn: jest.fn(),
      verifyNin: jest.fn(),
      getStatus: jest.fn(),
      createSubaccount: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [KycController],
      providers: [
        { provide: KycService, useValue: service },
        { provide: AuthService, useValue: { getAuthenticatedUser: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(KycController);
  });

  it('verifies BVN', async () => {
    const dto: VerifyBvnDto = {
      number: '12345678901',
      firstName: 'Ada',
      lastName: 'Okafor',
      dateOfBirth: '09-10-1990',
      phoneNumber: '08123456789',
    };
    service.verifyBvn.mockResolvedValue({ status: true });

    await expect(controller.verifyBvn(currentUser, dto)).resolves.toEqual({ status: true });
    expect(service.verifyBvn).toHaveBeenCalledWith(currentUser.id, dto);
  });

  it('verifies NIN', async () => {
    const dto: VerifyNinDto = {
      numberNin: '12345678901',
      surname: 'Okafor',
      firstname: 'Ada',
      birthdate: '09-10-1990',
      telephoneno: '08123456789',
    };
    service.verifyNin.mockResolvedValue({ success: true });

    await expect(controller.verifyNin(currentUser, dto)).resolves.toEqual({ success: true });
    expect(service.verifyNin).toHaveBeenCalledWith(currentUser.id, dto);
  });

  it('confirms the BVN OTP', async () => {
    const dto: ConfirmBvnDto = { transactionId: 'provider-trx', otp: '123456' };
    service.confirmBvn.mockResolvedValue({ verified: true });
    await expect(controller.confirmBvn(currentUser, dto)).resolves.toEqual({ verified: true });
    expect(service.confirmBvn).toHaveBeenCalledWith(currentUser.id, dto);
  });

  it('returns KYC status', async () => {
    service.getStatus.mockResolvedValue({ subaccountCreated: false });
    await expect(controller.getStatus(currentUser)).resolves.toEqual({ subaccountCreated: false });
    expect(service.getStatus).toHaveBeenCalledWith(currentUser.id);
  });

  it('creates a subaccount', async () => {
    const dto: CreateSubaccountDto = {
      bvn: '12345678901',
      state: 'Lagos',
      pin: '1234',
      address: '12 Marina Road, Lagos',
      country: 'NG',
    };
    service.createSubaccount.mockResolvedValue({ success: true });

    await expect(controller.createSubaccount(currentUser, dto)).resolves.toEqual({
      success: true,
    });
    expect(service.createSubaccount).toHaveBeenCalledWith(currentUser.id, dto);
  });
});
