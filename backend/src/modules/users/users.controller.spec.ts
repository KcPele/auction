import { Test } from '@nestjs/testing';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import type { ApplyListingAccessDto } from './dto/apply-listing-access.dto';
import type { RedeemAccessCodeDto } from './dto/redeem-access-code.dto';
import type { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  const currentUser: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    role: UserRole.IndividualBidder,
  };
  let controller: UsersController;
  let service: {
    getMe: jest.Mock;
    updateProfile: jest.Mock;
    updateNotificationPreferences: jest.Mock;
    applyForListingAccess: jest.Mock;
    redeemAccessCode: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getMe: jest.fn(),
      updateProfile: jest.fn(),
      updateNotificationPreferences: jest.fn(),
      applyForListingAccess: jest.fn(),
      redeemAccessCode: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = moduleRef.get(UsersController);
  });

  it('gets the current user', async () => {
    service.getMe.mockResolvedValue({ user: { id: currentUser.id } });

    await expect(controller.getMe(currentUser)).resolves.toEqual({
      user: { id: currentUser.id },
    });
    expect(service.getMe).toHaveBeenCalledWith(currentUser.id);
  });

  it('updates the current user profile', async () => {
    const dto: UpdateProfileDto = { firstName: 'Ada' };
    service.updateProfile.mockResolvedValue({ user: { firstName: 'Ada' } });

    await expect(controller.updateProfile(currentUser, dto)).resolves.toEqual({
      user: { firstName: 'Ada' },
    });
    expect(service.updateProfile).toHaveBeenCalledWith(currentUser.id, dto);
  });

  it('updates notification preferences', async () => {
    const dto: UpdateNotificationPreferencesDto = { readyToBid: true };
    service.updateNotificationPreferences.mockResolvedValue({
      notificationPreferences: dto,
    });

    await expect(
      controller.updateNotificationPreferences(currentUser, dto),
    ).resolves.toEqual({ notificationPreferences: dto });
    expect(service.updateNotificationPreferences).toHaveBeenCalledWith(
      currentUser.id,
      dto,
    );
  });

  it('submits a listing access application', async () => {
    const dto: ApplyListingAccessDto = {
      category: 'CAR' as ApplyListingAccessDto['category'],
      reason: 'I inspect cars for sellers.',
    };
    service.applyForListingAccess.mockResolvedValue({ application: dto });

    await expect(
      controller.applyForListingAccess(currentUser, dto),
    ).resolves.toEqual({ application: dto });
    expect(service.applyForListingAccess).toHaveBeenCalledWith(
      currentUser.id,
      dto,
    );
  });

  it('redeems an access code', async () => {
    const dto: RedeemAccessCodeDto = { code: 'AUC-1A2B3C4D' };
    service.redeemAccessCode.mockResolvedValue({ listingPermission: dto });

    await expect(
      controller.redeemAccessCode(currentUser, dto),
    ).resolves.toEqual({ listingPermission: dto });
    expect(service.redeemAccessCode).toHaveBeenCalledWith(currentUser.id, dto);
  });
});
