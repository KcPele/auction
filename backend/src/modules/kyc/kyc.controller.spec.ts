import { Test } from '@nestjs/testing';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuthService } from '../auth/auth.service';
import type { CreateSubaccountDto } from './dto/create-subaccount.dto';
import type { SendOtpDto } from './dto/send-otp.dto';
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
    verifyNin: jest.Mock;
    sendOtp: jest.Mock;
    createSubaccount: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      verifyBvn: jest.fn(),
      verifyNin: jest.fn(),
      sendOtp: jest.fn(),
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

    await expect(controller.verifyBvn(dto)).resolves.toEqual({ status: true });
    expect(service.verifyBvn).toHaveBeenCalledWith(dto);
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

    await expect(controller.verifyNin(dto)).resolves.toEqual({ success: true });
    expect(service.verifyNin).toHaveBeenCalledWith(dto);
  });

  it('sends OTP', async () => {
    const dto: SendOtpDto = { phone: '08123456789', otp: '123456' };
    service.sendOtp.mockResolvedValue({ status: true });

    await expect(controller.sendOtp(dto)).resolves.toEqual({ status: true });
    expect(service.sendOtp).toHaveBeenCalledWith(dto);
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
