import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuctionSettlementFields1766622000000
  implements MigrationInterface
{
  name = 'AddAuctionSettlementFields1766622000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "auctions"
        ADD "externalPaymentKobo" bigint,
        ADD "walletPaymentKobo" bigint,
        ADD "settledById" uuid,
        ADD "settledAt" timestamptz,
        ADD "defaultedAt" timestamptz,
        ADD "defaultReason" text,
        ADD CONSTRAINT "FK_auctions_settled_by"
          FOREIGN KEY ("settledById") REFERENCES "users"("id") ON DELETE SET NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "auctions"
        DROP CONSTRAINT "FK_auctions_settled_by",
        DROP COLUMN "defaultReason",
        DROP COLUMN "defaultedAt",
        DROP COLUMN "settledAt",
        DROP COLUMN "settledById",
        DROP COLUMN "walletPaymentKobo",
        DROP COLUMN "externalPaymentKobo"
    `);
  }
}
