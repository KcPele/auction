import { NotFoundException } from '@nestjs/common';
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
  const repository = { findOneBy: jest.fn() };
  const service = new GadgetsService(repository as never, {} as never);

  beforeEach(() => jest.clearAllMocks());

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
});
