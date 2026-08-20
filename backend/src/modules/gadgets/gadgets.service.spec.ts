import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ListingStatus } from '../../common/enums/listing-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { GadgetsService } from './gadgets.service';

describe('GadgetsService listing visibility', () => {
  const viewer: AuthenticatedUser = {
    id: 'viewer-id',
    role: UserRole.IndividualBidder,
    authRole: 'user',
    sessionId: 'session-id',
  };
  const repository = { findOneBy: jest.fn(), save: jest.fn() };
  const platformTogglesRepository = { findOneBy: jest.fn() };
  const service = new GadgetsService(
    repository as never,
    {} as never,
    platformTogglesRepository as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.save.mockImplementation(async (value) => value);
    platformTogglesRepository.findOneBy.mockResolvedValue(null);
  });

  it('blocks a draft submission while new listings are paused', async () => {
    platformTogglesRepository.findOneBy.mockResolvedValue({
      pauseNewListings: true,
    });

    await expect(
      service.submit(viewer.id, 'gadget-id'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(repository.findOneBy).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('hides another user draft listing', async () => {
    repository.findOneBy.mockResolvedValue({
      id: 'gadget-id',
      listerId: 'owner-id',
      status: ListingStatus.Draft,
    });

    await expect(service.findOne(viewer, 'gadget-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('allows authenticated users to view approved listings', async () => {
    repository.findOneBy.mockResolvedValue({
      id: 'gadget-id',
      listerId: 'owner-id',
      status: ListingStatus.Approved,
    });

    await expect(service.findOne(viewer, 'gadget-id')).resolves.toEqual({
      gadgetListing: expect.objectContaining({ id: 'gadget-id' }),
    });
  });

  it('returns a rejected listing to draft when its owner edits it', async () => {
    repository.findOneBy.mockResolvedValue({
      id: 'gadget-id',
      listerId: viewer.id,
      status: ListingStatus.Rejected,
      holdPercent: 10,
      startTime: new Date(Date.now() + 3_600_000),
      reviewedById: 'admin-id',
      reviewNote: 'Add proof of ownership',
      reviewedAt: new Date(),
    });

    const result = await service.update(viewer.id, 'gadget-id', {
      colour: 'Graphite',
    });

    expect(result.gadgetListing).toEqual(
      expect.objectContaining({
        status: ListingStatus.Draft,
        colour: 'Graphite',
        reviewedById: null,
        reviewNote: null,
        reviewedAt: null,
      }),
    );
  });
});
