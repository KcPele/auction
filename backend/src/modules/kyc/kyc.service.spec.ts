import { KycService } from './kyc.service';

describe('KycService', () => {
  it('persists a verified NIN only after the provider succeeds', async () => {
    const provider = { verifyNin: jest.fn().mockResolvedValue({ status: true }) };
    const user = { id: 'user-id', nin: null, ninVerifiedAt: null };
    const users = {
      findOneBy: jest.fn().mockResolvedValue(user),
      save: jest.fn(async (value) => value),
    };
    const service = new KycService(provider as never, users as never);
    const dto = {
      numberNin: '12345678901',
      surname: 'Okafor',
      firstname: 'Ada',
      birthdate: '09-10-1990',
      telephoneno: '08123456789',
    };

    await expect(service.verifyNin(user.id, dto)).resolves.toEqual({
      verified: true,
      data: { status: true },
    });
    expect(user.nin).toBe(dto.numberNin);
    expect(user.ninVerifiedAt).toBeInstanceOf(Date);
    expect(users.save).toHaveBeenCalledWith(user);
  });
});
