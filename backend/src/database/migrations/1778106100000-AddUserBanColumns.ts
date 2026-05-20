import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserBanColumns1778106100000 implements MigrationInterface {
  name = 'AddUserBanColumns1778106100000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isBanned" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banReason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bannedAt" timestamptz`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "bannedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "banReason"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "isBanned"`);
  }
}
