import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBiddingSettings1766621000000 implements MigrationInterface {
  name = 'CreateBiddingSettings1766621000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "bidding_settings" (
        "id" varchar(32) PRIMARY KEY,
        "bidRequirementPercent" integer NOT NULL DEFAULT 10,
        "updatedById" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_bidding_settings_updated_by"
          FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      INSERT INTO "bidding_settings" ("id", "bidRequirementPercent")
      VALUES ('default', 10)
      ON CONFLICT ("id") DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "bidding_settings"`);
  }
}
