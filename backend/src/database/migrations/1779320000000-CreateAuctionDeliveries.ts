import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuctionDeliveries1779320000000 implements MigrationInterface {
  name = 'CreateAuctionDeliveries1779320000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status_enum') THEN
          CREATE TYPE "delivery_status_enum" AS ENUM (
            'PAYMENT_CONFIRMED',
            'SCHEDULED',
            'IN_TRANSIT',
            'DELIVERED',
            'CANCELLED'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auction_deliveries" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "auctionId" uuid NOT NULL UNIQUE,
        "winnerId" uuid NOT NULL,
        "sellerId" uuid NOT NULL,
        "status" "delivery_status_enum" NOT NULL DEFAULT 'PAYMENT_CONFIRMED',
        "trackingInfo" text,
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_auction_deliveries_auction"
          FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "auction_deliveries"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "delivery_status_enum"`);
  }
}
