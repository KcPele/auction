import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWatchlistTable1778106300000 implements MigrationInterface {
  name = 'CreateWatchlistTable1778106300000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "watchlist" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "auctionId" uuid NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_watchlist_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_watchlist_auction"
          FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_watchlist_user_auction"
          UNIQUE ("userId", "auctionId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_watchlist_user_created" ON "watchlist" ("userId", "createdAt" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_watchlist_auction" ON "watchlist" ("auctionId")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_watchlist_auction"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_watchlist_user_created"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "watchlist"`);
  }
}
