import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthUserReferralCode1780000500000
  implements MigrationInterface
{
  name = 'AddAuthUserReferralCode1780000500000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "auth_users" ADD COLUMN IF NOT EXISTS "referral_code" text',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "auth_users" DROP COLUMN IF EXISTS "referral_code"',
    );
  }
}
