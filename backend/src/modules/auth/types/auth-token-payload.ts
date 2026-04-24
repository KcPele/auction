import type { UserRole } from '../../../common/enums/user-role.enum';

export type AuthTokenPayload = {
  sub: string;
  role: UserRole;
};
