import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateListingTables1766571000000 implements MigrationInterface {
  name = 'CreateListingTables1766571000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "listing_status_enum" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "car_listings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "listerId" uuid NOT NULL,
        "make" varchar(100) NOT NULL,
        "model" varchar(100) NOT NULL,
        "year" integer NOT NULL,
        "colour" varchar(50) NOT NULL,
        "registrationNumber" varchar(50) NOT NULL,
        "mileage" integer NOT NULL,
        "condition" varchar(100) NOT NULL,
        "knownFaults" text,
        "mechanicId" uuid,
        "photoUrls" jsonb NOT NULL DEFAULT '[]',
        "basePriceKobo" bigint NOT NULL,
        "holdPercent" integer NOT NULL,
        "minimumBidIncrementKobo" bigint NOT NULL,
        "startTime" timestamptz NOT NULL,
        "durationMinutes" integer NOT NULL,
        "status" "listing_status_enum" NOT NULL DEFAULT 'DRAFT',
        "reviewedById" uuid,
        "reviewNote" text,
        "reviewedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "gadget_listings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "listerId" uuid NOT NULL,
        "type" varchar(100) NOT NULL,
        "brand" varchar(100) NOT NULL,
        "model" varchar(100) NOT NULL,
        "colour" varchar(50) NOT NULL,
        "batteryHealthPercent" integer,
        "specs" jsonb NOT NULL DEFAULT '{}',
        "usageHistory" text NOT NULL,
        "defects" text,
        "proofDocumentUrl" varchar(500) NOT NULL,
        "photoUrls" jsonb NOT NULL DEFAULT '[]',
        "videoUrls" jsonb NOT NULL DEFAULT '[]',
        "basePriceKobo" bigint NOT NULL,
        "holdPercent" integer NOT NULL,
        "minimumBidIncrementKobo" bigint NOT NULL,
        "startTime" timestamptz NOT NULL,
        "durationMinutes" integer NOT NULL,
        "status" "listing_status_enum" NOT NULL DEFAULT 'DRAFT',
        "reviewedById" uuid,
        "reviewNote" text,
        "reviewedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_car_listings_active_registration" ON "car_listings" ("registrationNumber") WHERE "status" != 'REJECTED'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_car_listings_lister_status" ON "car_listings" ("listerId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_gadget_listings_lister_status" ON "gadget_listings" ("listerId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_car_listings_pending" ON "car_listings" ("status", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_gadget_listings_pending" ON "gadget_listings" ("status", "createdAt")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "gadget_listings"`);
    await queryRunner.query(`DROP TABLE "car_listings"`);
    await queryRunner.query(`DROP TYPE "listing_status_enum"`);
  }
}

