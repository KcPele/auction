import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthAndAdminTables1766570000000
  implements MigrationInterface
{
  name = 'CreateAuthAndAdminTables1766570000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM ('INDIVIDUAL_BIDDER', 'CAR_DEALER', 'MECHANIC', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "listing_category_enum" AS ENUM ('CAR', 'GADGET')`,
    );
    await queryRunner.query(
      `CREATE TYPE "listing_access_status_enum" AS ENUM ('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL UNIQUE,
        "phone" varchar(32) NOT NULL UNIQUE,
        "passwordHash" varchar(255) NOT NULL,
        "firstName" varchar(100) NOT NULL,
        "lastName" varchar(100) NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'INDIVIDUAL_BIDDER',
        "nin" varchar(32),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "tokenHash" varchar(255) NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "revokedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_refresh_tokens_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "notification_preferences" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL UNIQUE,
        "whatsappEnabled" boolean NOT NULL DEFAULT true,
        "readyToBid" boolean NOT NULL DEFAULT false,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_notification_preferences_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "user_listing_permissions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "category" "listing_category_enum" NOT NULL,
        "grantedById" uuid,
        "sourceCode" varchar(64),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_user_listing_permissions_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_user_listing_permissions_user_category"
          UNIQUE ("userId", "category")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "listing_access_applications" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "category" "listing_category_enum" NOT NULL,
        "reason" text NOT NULL,
        "status" "listing_access_status_enum" NOT NULL DEFAULT 'PENDING',
        "reviewedById" uuid,
        "reviewNote" text,
        "reviewedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_listing_access_applications_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "access_codes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code" varchar(64) NOT NULL UNIQUE,
        "category" "listing_category_enum" NOT NULL,
        "createdById" uuid NOT NULL,
        "usedById" uuid,
        "usedAt" timestamptz,
        "expiresAt" timestamptz,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "platform_fee_settings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "category" "listing_category_enum" NOT NULL UNIQUE,
        "sellerFeeBps" integer NOT NULL,
        "buyerFeeBps" integer NOT NULL,
        "updatedById" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_user_active" ON "refresh_tokens" ("userId", "expiresAt") WHERE "revokedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_listing_access_applications_pending" ON "listing_access_applications" ("status", "createdAt")`,
    );
    await queryRunner.query(`
      INSERT INTO "platform_fee_settings" ("category", "sellerFeeBps", "buyerFeeBps")
      VALUES ('CAR', 300, 0), ('GADGET', 500, 0)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "platform_fee_settings"`);
    await queryRunner.query(`DROP TABLE "access_codes"`);
    await queryRunner.query(`DROP TABLE "listing_access_applications"`);
    await queryRunner.query(`DROP TABLE "user_listing_permissions"`);
    await queryRunner.query(`DROP TABLE "notification_preferences"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "listing_access_status_enum"`);
    await queryRunner.query(`DROP TYPE "listing_category_enum"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
