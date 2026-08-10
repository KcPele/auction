import { NotFoundException } from '@nestjs/common';
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
  const repository = { findOneBy: jest.fn() };
  const service = new CarsService(repository as never, {} as never);

  beforeEach(() => jest.clearAllMocks());

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
});
