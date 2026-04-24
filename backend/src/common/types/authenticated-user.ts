import type { UserRole } from '../enums/user-role.enum';

export type AuthenticatedUser = {
  id: string;
  role: UserRole;
};
