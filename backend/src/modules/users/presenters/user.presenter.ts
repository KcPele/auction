import type { User } from '../entities/user.entity';

export function presentUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    nin: user.nin,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
