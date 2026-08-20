import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ListingStatus } from '../../common/enums/listing-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CarsService } from './cars.service';

describe('CarsService listing visibility', () => {
  const viewer: AuthenticatedUser = {
    id: 'viewer-id',
    role: UserRole.IndividualBidder,
    authRole: 'user',
    sessionId: 'session-id',
  };
  const repository = { findOneBy: jest.fn(), save: jest.fn() };
  const platformTogglesRepository = { findOneBy: jest.fn() };
  const mechanicProfilesRepository = { findOne: jest.fn() };
  const service = new CarsService(
    repository as never,
    {} as never,
    platformTogglesRepository as never,
    mechanicProfilesRepository as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.save.mockImplementation(async (value) => value);
    platformTogglesRepository.findOneBy.mockResolvedValue(null);
    mechanicProfilesRepository.findOne.mockResolvedValue({ id: 'mechanic-id' });
  });

  it('rejects an unverified mechanic during car creation', async () => {
    const permissionsRepository = {
      findOneBy: jest.fn().mockResolvedValue({ id: 'permission-id' }),
    };
    const serviceWithAccess = new CarsService(
      repository as never,
      permissionsRepository as never,
      platformTogglesRepository as never,
      mechanicProfilesRepository as never,
    );
    mechanicProfilesRepository.findOne.mockResolvedValue(null);

    await expect(
      serviceWithAccess.create(viewer.id, {
        mechanicId: 'mechanic-id',
      } as never),
    ).rejects.toThrow('Choose a verified mechanic');
    expect(repository.save).not.toHaveBeenCalled();
    expect(mechanicProfilesRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 'mechanic-id',
        status: 'VERIFIED',
        user: { isActive: true, isBanned: false },
      },
    });
  });

  it('blocks a draft submission while new listings are paused', async () => {
    platformTogglesRepository.findOneBy.mockResolvedValue({
      pauseNewListings: true,
    });

    await expect(service.submit(viewer.id, 'car-id')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(repository.findOneBy).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('hides another user draft listing', async () => {
    repository.findOneBy.mockResolvedValue({
      id: 'car-id',
      listerId: 'owner-id',
      status: ListingStatus.Draft,
    });

    await expect(service.findOne(viewer, 'car-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('allows authenticated users to view approved listings', async () => {
    repository.findOneBy.mockResolvedValue({
      id: 'car-id',
      listerId: 'owner-id',
      status: ListingStatus.Approved,
    });

    await expect(service.findOne(viewer, 'car-id')).resolves.toEqual({
      carListing: expect.objectContaining({ id: 'car-id' }),
    });
  });

  it('returns a rejected listing to draft when its owner edits it', async () => {
    repository.findOneBy.mockResolvedValue({
      id: 'car-id',
      listerId: viewer.id,
      status: ListingStatus.Rejected,
      holdPercent: 10,
      startTime: new Date(Date.now() + 3_600_000),
      reviewedById: 'admin-id',
      reviewNote: 'Add clearer photos',
      reviewedAt: new Date(),
    });

    const result = await service.update(viewer.id, 'car-id', {
      colour: 'Midnight blue',
    });

    expect(result.carListing).toEqual(
      expect.objectContaining({
        status: ListingStatus.Draft,
        colour: 'Midnight blue',
        reviewedById: null,
        reviewNote: null,
        reviewedAt: null,
      }),
    );
  });
});
