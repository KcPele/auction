import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuctionAndBidTables1766576000000
  implements MigrationInterface
{
  name = 'CreateAuctionAndBidTables1766576000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "auction_status_enum" AS ENUM (
        'DRAFT',
        'PENDING_APPROVAL',
        'SCHEDULED',
        'LIVE',
        'ENDED',
        'AWAITING_PAYMENT',
        'SETTLED',
        'DEFAULTED',
        'CANCELLED',
        'RELISTED'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "bid_status_enum" AS ENUM (
        'ACCEPTED',
        'RELEASED',
        'WINNING',
        'OUTBID',
        'CANCELLED'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "auctions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "category" "listing_category_enum" NOT NULL,
        "listingId" uuid NOT NULL,
        "sellerId" uuid NOT NULL,
        "basePriceKobo" bigint NOT NULL,
        "minimumBidIncrementKobo" bigint NOT NULL,
        "holdPercent" integer NOT NULL,
        "sellerFeeBps" integer NOT NULL,
        "buyerFeeBps" integer NOT NULL,
        "startTime" timestamptz NOT NULL,
        "durationMinutes" integer NOT NULL,
        "endTime" timestamptz NOT NULL,
        "status" "auction_status_enum" NOT NULL DEFAULT 'SCHEDULED',
        "currentWinningBidId" uuid,
        "winnerId" uuid,
        "paymentDeadlineAt" timestamptz,
        "cancelledById" uuid,
        "cancellationReason" text,
        "cancelledAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_auctions_seller"
          FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_auctions_category_listing"
          UNIQUE ("category", "listingId")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "bids" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "auctionId" uuid NOT NULL,
        "bidderId" uuid NOT NULL,
        "amountKobo" bigint NOT NULL,
        "walletHoldId" uuid,
        "status" "bid_status_enum" NOT NULL DEFAULT 'ACCEPTED',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_bids_auction"
          FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bids_bidder"
          FOREIGN KEY ("bidderId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bids_wallet_hold"
          FOREIGN KEY ("walletHoldId") REFERENCES "wallet_holds"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_auctions_status_start" ON "auctions" ("status", "startTime")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_auctions_category_start" ON "auctions" ("category", "startTime")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bids_auction_amount" ON "bids" ("auctionId", "amountKobo")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_bids_auction_amount"`);
    await queryRunner.query(`DROP INDEX "IDX_auctions_category_start"`);
    await queryRunner.query(`DROP INDEX "IDX_auctions_status_start"`);
    await queryRunner.query(`DROP TABLE "bids"`);
    await queryRunner.query(`DROP TABLE "auctions"`);
    await queryRunner.query(`DROP TYPE "bid_status_enum"`);
    await queryRunner.query(`DROP TYPE "auction_status_enum"`);
  }
}
