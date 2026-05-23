import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCarListingVideos1779321000000 implements MigrationInterface {
  name = 'AddCarListingVideos1779321000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "car_listings"
      ADD COLUMN IF NOT EXISTS "videoUrls" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "car_listings" DROP COLUMN IF EXISTS "videoUrls"
    `);
  }
}
