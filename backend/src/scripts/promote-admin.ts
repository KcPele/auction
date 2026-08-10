import 'reflect-metadata';
import 'dotenv/config';
import dataSource from '../database/typeorm-cli.config';

type UserIdentity = {
  id: string;
  authId: string;
  email: string;
};

async function promoteAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!email) {
    throw new Error('ADMIN_EMAIL is required');
  }

  await dataSource.initialize();

  try {
    const identity = await dataSource.transaction(async (manager) => {
      const matches = await manager.query<UserIdentity[]>(
        `
          SELECT u.id, au.id AS "authId", u.email
          FROM users u
          INNER JOIN auth_users au ON au.id = u.id
          WHERE LOWER(u.email) = LOWER($1)
            AND LOWER(au.email) = LOWER($1)
          FOR UPDATE OF u, au
        `,
        [email],
      );

      if (matches.length !== 1) {
        throw new Error(
          `Expected one linked user for ${email}, found ${matches.length}`,
        );
      }

      const user = matches[0];

      await manager.query(
        `
          UPDATE auth_users
          SET role = 'admin',
              app_role = 'ADMIN',
              banned = false,
              "banReason" = NULL,
              "banExpires" = NULL
          WHERE id = $1
        `,
        [user.id],
      );

      await manager.query(
        `
          UPDATE users
          SET role = 'ADMIN',
              "isActive" = true,
              "isBanned" = false,
              "banReason" = NULL,
              "bannedAt" = NULL
          WHERE id = $1
        `,
        [user.id],
      );

      return user;
    });

    console.log(`Promoted ${identity.email} (${identity.id}) to admin.`);
  } finally {
    await dataSource.destroy();
  }
}

promoteAdmin().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
