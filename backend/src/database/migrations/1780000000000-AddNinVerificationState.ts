import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNinVerificationState1780000000000
  implements MigrationInterface
{
  name = 'AddNinVerificationState1780000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ninVerifiedAt" timestamptz',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "ninVerifiedAt"',
    );
  }
}
