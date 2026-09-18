import type { EntityManager } from 'typeorm';

export type PrepareBetaAccountInput = {
  email: string;
  verifyEmail: boolean;
  verifyKyc: boolean;
};

type UserIdentity = {
  id: string;
  email: string;
};

export type PreparedBetaAccount = UserIdentity & {
  emailVerified: boolean;
  kycVerified: boolean;
};

export async function prepareBetaAccount(
  manager: EntityManager,
  input: PrepareBetaAccountInput,
): Promise<PreparedBetaAccount> {
  const email = input.email.trim().toLowerCase();
  const matches = await manager.query<UserIdentity[]>(
    `
      SELECT u.id, u.email
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

  if (input.verifyEmail) {
    await manager.query(
      `UPDATE auth_users SET email_verified = true WHERE id = $1`,
      [user.id],
    );
  }

  if (input.verifyKyc) {
    await manager.query(
      `
        UPDATE users
        SET nin = COALESCE(nin, '90000000001'),
            "ninVerifiedAt" = COALESCE("ninVerifiedAt", CURRENT_TIMESTAMP)
        WHERE id = $1
      `,
      [user.id],
    );
    await manager.query(
      `
        INSERT INTO kyc_profiles (
          "userId", "bvnVerifiedAt", "phoneVerifiedAt",
          "strowalletSubaccountId"
        )
        VALUES (
          $1::uuid,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          'qa_' || ($1::uuid)::text
        )
        ON CONFLICT ("userId") DO UPDATE
        SET "bvnVerifiedAt" = COALESCE(
              kyc_profiles."bvnVerifiedAt", EXCLUDED."bvnVerifiedAt"
            ),
            "phoneVerifiedAt" = COALESCE(
              kyc_profiles."phoneVerifiedAt", EXCLUDED."phoneVerifiedAt"
            ),
            "strowalletSubaccountId" = COALESCE(
              kyc_profiles."strowalletSubaccountId",
              EXCLUDED."strowalletSubaccountId"
            ),
            "updatedAt" = CURRENT_TIMESTAMP
      `,
      [user.id],
    );
  }

  return {
    ...user,
    emailVerified: input.verifyEmail,
    kycVerified: input.verifyKyc,
  };
}

async function runCli() {
  const { default: dataSource } = await import(
    '../database/typeorm-cli.config'
  );
  const emailFlagIndex = process.argv.indexOf('--email');
  const email = process.argv[emailFlagIndex + 1];

  if (emailFlagIndex === -1 || !email) {
    throw new Error('--email is required');
  }

  await dataSource.initialize();

  try {
    const result = await dataSource.transaction((manager) =>
      prepareBetaAccount(manager, {
        email,
        verifyEmail: process.argv.includes('--verify-email'),
        verifyKyc: process.argv.includes('--verify-kyc'),
      }),
    );
    console.log(
      `Prepared ${result.email} (email: ${result.emailVerified}, KYC: ${result.kycVerified}).`,
    );
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
