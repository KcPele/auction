import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { KycService } from './kyc.service';

describe('KycService', () => {
  const testSecret = 'test-better-auth-secret';
  let provider: {
    verifyNin: jest.Mock;
    verifyBvn: jest.Mock;
    confirmBvn: jest.Mock;
    createSubaccount: jest.Mock;
  };
  let users: { findOneBy: jest.Mock; save: jest.Mock };
  let profiles: { findOneBy: jest.Mock; create: jest.Mock; save: jest.Mock };
  let service: KycService;
  const user = {
    id: 'user-id',
    email: 'ada@example.com',
    phone: '+2348123456789',
    firstName: 'Ada',
    lastName: 'Okafor',
    nin: null,
    ninVerifiedAt: null,
  };

  beforeEach(() => {
    provider = {
      verifyNin: jest.fn(),
      verifyBvn: jest.fn(),
      confirmBvn: jest.fn(),
      createSubaccount: jest.fn(),
    };
    users = {
      findOneBy: jest.fn().mockResolvedValue({ ...user }),
      save: jest.fn(async (value) => value),
    };
    profiles = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    service = new KycService(
      provider as never,
      users as never,
      profiles as never,
      { getOrThrow: jest.fn().mockReturnValue(testSecret) } as never,
    );
  });

  it('persists a verified NIN only after the provider succeeds', async () => {
    provider.verifyNin.mockResolvedValue({ status: true });
    const dto = ninDto();

    await expect(service.verifyNin(user.id, dto)).resolves.toEqual({
      verified: true,
      data: { status: true },
    });
    const saved = users.save.mock.calls[0][0];
    expect(saved.nin).toBe(dto.numberNin);
    expect(saved.ninVerifiedAt).toBeInstanceOf(Date);
  });

  it('starts BVN verification and returns its OTP transaction', async () => {
    provider.verifyBvn.mockResolvedValue({
      status: true,
      trx: 'provider-transaction',
      message: 'OTP sent',
    });

    await expect(service.verifyBvn(user.id, bvnDto())).resolves.toEqual({
      verified: false,
      otpRequired: true,
      transactionId: 'provider-transaction',
      message: 'OTP sent',
    });
    expect(profiles.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        pendingBvnTransactionId: 'provider-transaction',
        pendingBvnHash: bvnHash('12345678901'),
      }),
    );
  });

  it('requires the account phone for BVN verification', async () => {
    await expect(
      service.verifyBvn(user.id, bvnDto({ phoneNumber: '08000000000' })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(provider.verifyBvn).not.toHaveBeenCalled();
  });

  it('rejects a provider response without a BVN transaction', async () => {
    provider.verifyBvn.mockResolvedValue({ status: true });
    await expect(service.verifyBvn(user.id, bvnDto())).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('persists BVN and phone verification after OTP confirmation', async () => {
    profiles.findOneBy.mockResolvedValue({
      userId: user.id,
      pendingBvnTransactionId: 'provider-transaction',
      pendingBvnHash: bvnHash('12345678901'),
      verifiedBvnHash: null,
      bvnVerifiedAt: null,
      phoneVerifiedAt: null,
      strowalletSubaccountId: null,
    });
    provider.confirmBvn.mockResolvedValue({ success: true });
    await expect(
      service.confirmBvn(user.id, {
        transactionId: 'provider-transaction',
        otp: '123456',
      }),
    ).resolves.toEqual(
      expect.objectContaining({ verified: true, data: { success: true } }),
    );
    const saved = profiles.save.mock.calls[0][0];
    expect(saved.bvnVerifiedAt).toBeInstanceOf(Date);
    expect(saved.phoneVerifiedAt).toBeInstanceOf(Date);
    expect(saved.verifiedBvnHash).toBe(bvnHash('12345678901'));
    expect(saved.pendingBvnTransactionId).toBeNull();
    expect(saved.pendingBvnHash).toBeNull();
  });

  it('rejects a BVN confirmation transaction initiated by another user', async () => {
    profiles.findOneBy.mockResolvedValue({
      userId: user.id,
      pendingBvnTransactionId: 'different-transaction',
      pendingBvnHash: bvnHash('12345678901'),
    });

    await expect(
      service.confirmBvn(user.id, {
        transactionId: 'provider-transaction',
        otp: '123456',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(provider.confirmBvn).not.toHaveBeenCalled();
  });

  it('requires verified BVN before creating a subaccount', async () => {
    await expect(service.createSubaccount(user.id, subaccountDto())).rejects.toThrow(
      'Complete BVN OTP verification first',
    );
  });

  it('creates and persists a provider subaccount ID', async () => {
    profiles.findOneBy.mockResolvedValue({
      userId: user.id,
      bvnVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      verifiedBvnHash: bvnHash('12345678901'),
      strowalletSubaccountId: null,
    });
    provider.createSubaccount.mockResolvedValue({
      success: true,
      subaccount_id: 'subaccount-id',
    });

    await expect(service.createSubaccount(user.id, subaccountDto())).resolves.toEqual(
      expect.objectContaining({ created: true, subaccountId: 'subaccount-id' }),
    );
    expect(profiles.save).toHaveBeenCalledWith(
      expect.objectContaining({ strowalletSubaccountId: 'subaccount-id' }),
    );
  });

  it('rejects a subaccount BVN that differs from the verified BVN', async () => {
    profiles.findOneBy.mockResolvedValue({
      userId: user.id,
      bvnVerifiedAt: new Date(),
      verifiedBvnHash: bvnHash('10987654321'),
      strowalletSubaccountId: null,
    });

    await expect(service.createSubaccount(user.id, subaccountDto())).rejects.toThrow(
      'Use the BVN that completed OTP verification',
    );
    expect(provider.createSubaccount).not.toHaveBeenCalled();
  });

  it('returns the persisted KYC completion state', async () => {
    const verifiedAt = new Date('2026-08-10T12:00:00.000Z');
    users.findOneBy.mockResolvedValue({ ...user, ninVerifiedAt: verifiedAt });
    profiles.findOneBy.mockResolvedValue({
      bvnVerifiedAt: verifiedAt,
      phoneVerifiedAt: verifiedAt,
      strowalletSubaccountId: 'subaccount-id',
    });
    await expect(service.getStatus(user.id)).resolves.toEqual({
      ninVerifiedAt: verifiedAt,
      bvnVerifiedAt: verifiedAt,
      phoneVerifiedAt: verifiedAt,
      subaccountCreated: true,
    });
  });
});

function ninDto() {
  return {
    numberNin: '12345678901',
    surname: 'Okafor',
    firstname: 'Ada',
    birthdate: '09-10-1990',
    telephoneno: '08123456789',
  };
}

function bvnDto(overrides: Record<string, unknown> = {}) {
  return {
    number: '12345678901',
    firstName: 'Ada',
    lastName: 'Okafor',
    dateOfBirth: '09-10-1990',
    phoneNumber: '08123456789',
    ...overrides,
  };
}

function subaccountDto() {
  return {
    bvn: '12345678901',
    state: 'Lagos',
    pin: '1234',
    address: '12 Marina Road, Lagos',
    country: 'NG',
  };
}

function bvnHash(bvn: string) {
  return createHmac('sha256', 'test-better-auth-secret')
    .update(bvn)
    .digest('hex');
}
