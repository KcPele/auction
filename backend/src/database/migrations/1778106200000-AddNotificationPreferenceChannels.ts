import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationPreferenceChannels1778106200000
  implements MigrationInterface
{
  name = 'AddNotificationPreferenceChannels1778106200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "emailEnabled" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "pushEnabled" boolean NOT NULL DEFAULT true`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_preferences" DROP COLUMN IF EXISTS "pushEnabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_preferences" DROP COLUMN IF EXISTS "emailEnabled"`,
    );
  }
}
