import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWalletAndPaymentTables1766575000000
  implements MigrationInterface
{
  name = 'CreateWalletAndPaymentTables1766575000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "wallet_ledger_type_enum" AS ENUM (
        'TOP_UP_INITIATED',
        'TOP_UP_CONFIRMED',
        'BID_HOLD_CREATED',
        'BID_HOLD_RELEASED',
        'BID_HOLD_APPLIED',
        'BID_HOLD_FORFEITED',
        'FINAL_PAYMENT_CONFIRMED',
        'ADMIN_ADJUSTMENT'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "wallet_hold_status_enum" AS ENUM (
        'ACTIVE',
        'RELEASED',
        'APPLIED',
        'FORFEITED'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "payment_provider_enum" AS ENUM ('OPAY')
    `);
    await queryRunner.query(`
      CREATE TYPE "top_up_status_enum" AS ENUM (
        'PENDING',
        'CONFIRMED',
        'FAILED',
        'EXPIRED'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL UNIQUE,
        "currency" varchar(3) NOT NULL DEFAULT 'NGN',
        "balanceKobo" bigint NOT NULL DEFAULT 0,
        "heldKobo" bigint NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_wallets_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "wallet_ledger_entries" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "walletId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "type" "wallet_ledger_type_enum" NOT NULL,
        "amountKobo" bigint NOT NULL,
        "balanceBeforeKobo" bigint NOT NULL,
        "balanceAfterKobo" bigint NOT NULL,
        "heldBeforeKobo" bigint NOT NULL,
        "heldAfterKobo" bigint NOT NULL,
        "reference" varchar(128),
        "metadata" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_wallet_ledger_entries_wallet"
          FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "wallet_top_ups" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "walletId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "amountKobo" bigint NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'NGN',
        "status" "top_up_status_enum" NOT NULL DEFAULT 'PENDING',
        "provider" "payment_provider_enum" NOT NULL DEFAULT 'OPAY',
        "providerReference" varchar(128) NOT NULL UNIQUE,
        "checkoutUrl" text,
        "providerPayload" jsonb,
        "confirmedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_wallet_top_ups_wallet"
          FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "wallet_holds" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "walletId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "auctionId" uuid,
        "bidId" uuid,
        "amountKobo" bigint NOT NULL,
        "status" "wallet_hold_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "releasedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_wallet_holds_wallet"
          FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "payment_webhook_events" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "provider" "payment_provider_enum" NOT NULL,
        "eventId" varchar(160) NOT NULL UNIQUE,
        "eventType" varchar(100),
        "payload" jsonb NOT NULL,
        "processedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_wallet_ledger_entries_wallet_created" ON "wallet_ledger_entries" ("walletId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallet_top_ups_user_created" ON "wallet_top_ups" ("userId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallet_holds_wallet_status" ON "wallet_holds" ("walletId", "status")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_wallet_holds_wallet_status"`);
    await queryRunner.query(`DROP INDEX "IDX_wallet_top_ups_user_created"`);
    await queryRunner.query(`DROP INDEX "IDX_wallet_ledger_entries_wallet_created"`);
    await queryRunner.query(`DROP TABLE "payment_webhook_events"`);
    await queryRunner.query(`DROP TABLE "wallet_holds"`);
    await queryRunner.query(`DROP TABLE "wallet_top_ups"`);
    await queryRunner.query(`DROP TABLE "wallet_ledger_entries"`);
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(`DROP TYPE "top_up_status_enum"`);
    await queryRunner.query(`DROP TYPE "payment_provider_enum"`);
    await queryRunner.query(`DROP TYPE "wallet_hold_status_enum"`);
    await queryRunner.query(`DROP TYPE "wallet_ledger_type_enum"`);
  }
}
