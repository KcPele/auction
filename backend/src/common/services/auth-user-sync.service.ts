import { Injectable, NotFoundException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';

interface AuthUserProfile {
  firstName: string;
  lastName: string;
  phone: string;
}

/**
 * better-auth keeps its own user row in `auth_users`, keyed by the same id as
 * `users`. Names and phone numbers live in both tables, so anything writing
 * them to `users` has to write them here too or the two drift apart — and
 * `auth_users.phone` carries a UNIQUE constraint of its own, which a check
 * against `users` alone will not catch.
 */
@Injectable()
export class AuthUserSyncService {
  /** Checks both user tables, since either one can reject the number. */
  async isPhoneTaken(
    manager: EntityManager,
    phone: string,
    exceptUserId: string,
  ) {
    const rows = await manager.query<unknown[]>(
      `SELECT 1 FROM "users" WHERE "phone" = $1 AND "id" <> $2
       UNION ALL
       SELECT 1 FROM "auth_users" WHERE "phone" = $1 AND "id" <> $2
       LIMIT 1`,
      [phone, exceptUserId],
    );

    return rows.length > 0;
  }

  async syncProfile(
    manager: EntityManager,
    userId: string,
    profile: AuthUserProfile,
  ) {
    const [, affected] = await manager.query<[unknown[], number]>(
      `UPDATE "auth_users"
       SET "phone" = $2,
           "first_name" = $3,
           "last_name" = $4,
           "name" = $5,
           "updated_at" = CURRENT_TIMESTAMP
       WHERE "id" = $1
      `,
      [
        userId,
        profile.phone,
        profile.firstName,
        profile.lastName,
        `${profile.firstName} ${profile.lastName}`.trim(),
      ],
    );

    if (affected !== 1) {
      throw new NotFoundException('Linked auth user not found');
    }
  }
}
