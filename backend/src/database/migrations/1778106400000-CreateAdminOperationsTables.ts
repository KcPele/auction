import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminOperationsTables1778106400000
  implements MigrationInterface
{
  name = 'CreateAdminOperationsTables1778106400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_status_enum') THEN
          CREATE TYPE "dispute_status_enum" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mechanic_verification_status_enum') THEN
          CREATE TYPE "mechanic_verification_status_enum" AS ENUM ('PENDING', 'VERIFIED', 'REVOKED');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "disputes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "auctionId" uuid NOT NULL,
        "buyerId" uuid NOT NULL,
        "sellerId" uuid NOT NULL,
        "amountKobo" bigint NOT NULL,
        "reason" text NOT NULL,
        "status" "dispute_status_enum" NOT NULL DEFAULT 'OPEN',
        "resolution" text,
        "resolvedById" uuid,
        "resolvedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mechanic_profiles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL UNIQUE,
        "shopName" varchar(160),
        "city" varchar(100),
        "status" "mechanic_verification_status_enum" NOT NULL DEFAULT 'PENDING',
        "inspectionCount" integer NOT NULL DEFAULT 0,
        "ratingSum" integer NOT NULL DEFAULT 0,
        "ratingCount" integer NOT NULL DEFAULT 0,
        "verifiedById" uuid,
        "verifiedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_mechanic_profiles_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_delivery_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "channel" varchar(32) NOT NULL,
        "template" varchar(160) NOT NULL,
        "recipient" varchar(255) NOT NULL,
        "status" varchar(32) NOT NULL,
        "error" text,
        "notificationId" uuid,
        "userId" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "escrow_settings" (
        "id" varchar(32) PRIMARY KEY,
        "minHoldBps" integer NOT NULL DEFAULT 1000,
        "maxHoldBps" integer NOT NULL DEFAULT 2000,
        "paymentWindowHours" integer NOT NULL DEFAULT 24,
        "autoExtendMinutes" integer NOT NULL DEFAULT 0,
        "updatedById" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "platform_toggles" (
        "id" varchar(32) PRIMARY KEY,
        "emailNotifications" boolean NOT NULL DEFAULT true,
        "whatsappNotifications" boolean NOT NULL DEFAULT true,
        "pauseNewListings" boolean NOT NULL DEFAULT false,
        "updatedById" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_disputes_status_created" ON "disputes" ("status", "createdAt" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mechanic_profiles_status" ON "mechanic_profiles" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notification_delivery_logs_created" ON "notification_delivery_logs" ("createdAt" DESC)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notification_delivery_logs_created"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mechanic_profiles_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_disputes_status_created"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "platform_toggles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "escrow_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_delivery_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mechanic_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "disputes"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "mechanic_verification_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "dispute_status_enum"`);
  }
}
