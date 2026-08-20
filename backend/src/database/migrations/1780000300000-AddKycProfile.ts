import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKycProfile1780000300000 implements MigrationInterface {
  name = 'AddKycProfile1780000300000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "kyc_profiles" (
        "id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
        "userId" uuid NOT NULL UNIQUE,
        "bvnVerifiedAt" timestamptz,
        "phoneVerifiedAt" timestamptz,
        "pendingBvnTransactionId" varchar(128),
        "pendingBvnHash" varchar(64),
        "verifiedBvnHash" varchar(64),
        "strowalletSubaccountId" varchar(128),
        "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_kyc_profiles_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "kyc_profiles"');
  }
}
