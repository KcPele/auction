import { BadRequestException } from '@nestjs/common';
import { UserProfileService } from './user-profile.service';

describe('UserProfileService', () => {
  let users: { findOneBy: jest.Mock; save: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let authUserSync: { isPhoneTaken: jest.Mock; syncProfile: jest.Mock };
  let service: UserProfileService;

  const user = {
    id: 'user-id',
    firstName: 'Ada',
    lastName: 'Okafor',
    phone: '+2348000000000',
    isActive: true,
  };

  beforeEach(() => {
    users = {
      findOneBy: jest.fn().mockResolvedValue({ ...user }),
      save: jest.fn(async (value) => value),
    };
    dataSource = {
      transaction: jest.fn(async (callback) =>
        callback({ getRepository: () => users } as never),
      ),
    };
    authUserSync = {
      isPhoneTaken: jest.fn().mockResolvedValue(false),
      syncProfile: jest.fn().mockResolvedValue(undefined),
    };
    service = new UserProfileService(
      dataSource as never,
      authUserSync as never,
    );
  });

  it('mirrors the saved profile onto the better-auth user row', async () => {
    await service.updateProfile(user.id, { phone: '+2347019736590' });

    expect(authUserSync.syncProfile).toHaveBeenCalledWith(
      expect.anything(),
      user.id,
      expect.objectContaining({ phone: '+2347019736590' }),
    );
  });

  it('rejects a phone number held by either user table', async () => {
    authUserSync.isPhoneTaken.mockResolvedValue(true);

    await expect(
      service.updateProfile(user.id, { phone: '+2347019736590' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(users.save).not.toHaveBeenCalled();
  });

  it('skips the availability check when the phone is unchanged', async () => {
    await service.updateProfile(user.id, { phone: user.phone });

    expect(authUserSync.isPhoneTaken).not.toHaveBeenCalled();
    expect(users.save).toHaveBeenCalled();
  });

  it('rejects a blank name', async () => {
    await expect(
      service.updateProfile(user.id, { firstName: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
