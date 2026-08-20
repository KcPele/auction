import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PreventDuplicateAuctionDisputes1780000200000
  implements MigrationInterface
{
  name = 'PreventDuplicateAuctionDisputes1780000200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_disputes_auction_unique" ON "disputes" ("auctionId")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_disputes_auction_unique"`);
  }
}
