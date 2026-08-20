import { BadRequestException } from '@nestjs/common';
import { KycRequirementService } from './kyc-requirement.service';

describe('KycRequirementService', () => {
  const verifiedAt = new Date();

  it('requires NIN and BVN before bidding', async () => {
    const service = new KycRequirementService(
      { findOneBy: jest.fn().mockResolvedValue({ ninVerifiedAt: null }) } as never,
      { findOneBy: jest.fn().mockResolvedValue(null) } as never,
    );
    await expect(service.assertCanBid('user-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('requires a payment account before withdrawing', async () => {
    const service = new KycRequirementService(
      {
        findOneBy: jest.fn().mockResolvedValue({ ninVerifiedAt: verifiedAt }),
      } as never,
      {
        findOneBy: jest.fn().mockResolvedValue({
          bvnVerifiedAt: verifiedAt,
          strowalletSubaccountId: null,
        }),
      } as never,
    );
    await expect(service.assertCanWithdraw('user-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('allows fully verified users to bid and withdraw', async () => {
    const service = new KycRequirementService(
      {
        findOneBy: jest.fn().mockResolvedValue({ ninVerifiedAt: verifiedAt }),
      } as never,
      {
        findOneBy: jest.fn().mockResolvedValue({
          bvnVerifiedAt: verifiedAt,
          strowalletSubaccountId: 'subaccount-id',
        }),
      } as never,
    );
    await expect(service.assertCanBid('user-id')).resolves.toBeUndefined();
    await expect(service.assertCanWithdraw('user-id')).resolves.toBeUndefined();
  });
});
