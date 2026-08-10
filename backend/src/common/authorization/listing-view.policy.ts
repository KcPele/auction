import { NotFoundException } from '@nestjs/common';
import { ListingStatus } from '../enums/listing-status.enum';
import { UserRole } from '../enums/user-role.enum';
import type { AuthenticatedUser } from '../types/authenticated-user';

export function assertCanViewListing(
  user: AuthenticatedUser,
  listing: { status: ListingStatus; listerId: string },
  notFoundMessage: string,
) {
  const canView =
    listing.status === ListingStatus.Approved ||
    listing.listerId === user.id ||
    user.role === UserRole.Admin;
  if (!canView) throw new NotFoundException(notFoundMessage);
}
