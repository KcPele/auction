import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMonnifyWalletFunding1766610000000
  implements MigrationInterface
{
  name = 'AddMonnifyWalletFunding1766610000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "payment_provider_enum" ADD VALUE IF NOT EXISTS 'MONNIFY'
    `);
    await queryRunner.query(`
      ALTER TYPE "wallet_ledger_type_enum" ADD VALUE IF NOT EXISTS 'WALLET_FUNDING_CONFIRMED'
    `);
    await queryRunner.query(`
      ALTER TYPE "wallet_ledger_type_enum" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_REQUESTED'
    `);
    await queryRunner.query(`
      ALTER TYPE "wallet_ledger_type_enum" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_FAILED'
    `);
    await queryRunner.query(`
      ALTER TYPE "wallet_ledger_type_enum" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_CONFIRMED'
    `);
    await queryRunner.query(`
      CREATE TYPE "wallet_funding_account_status_enum" AS ENUM (
        'ACTIVE',
        'INACTIVE'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "wallet_withdrawal_status_enum" AS ENUM (
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'FAILED',
        'REVERSED'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "wallet_funding_accounts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "walletId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "provider" "payment_provider_enum" NOT NULL,
        "accountReference" varchar(128) NOT NULL UNIQUE,
        "accountNumber" varchar(64) NOT NULL,
        "accountName" varchar(160) NOT NULL,
        "bankName" varchar(120) NOT NULL,
        "bankCode" varchar(32),
        "reservationReference" varchar(128),
        "status" "wallet_funding_account_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "providerPayload" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_wallet_funding_accounts_wallet"
          FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_wallet_funding_accounts_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "wallet_withdrawals" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "walletId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "amountKobo" bigint NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'NGN',
        "status" "wallet_withdrawal_status_enum" NOT NULL DEFAULT 'PENDING',
        "provider" "payment_provider_enum" NOT NULL,
        "providerReference" varchar(128) NOT NULL UNIQUE,
        "destinationBankCode" varchar(32) NOT NULL,
        "destinationBankName" varchar(120) NOT NULL,
        "destinationAccountNumber" varchar(32) NOT NULL,
        "destinationAccountName" varchar(160) NOT NULL,
        "narration" text,
        "providerPayload" jsonb,
        "completedAt" timestamptz,
        "failedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_wallet_withdrawals_wallet"
          FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_wallet_withdrawals_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_wallet_funding_accounts_user_provider" ON "wallet_funding_accounts" ("userId", "provider")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallet_withdrawals_user_created" ON "wallet_withdrawals" ("userId", "createdAt")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_wallet_withdrawals_user_created"`);
    await queryRunner.query(
      `DROP INDEX "IDX_wallet_funding_accounts_user_provider"`,
    );
    await queryRunner.query(`DROP TABLE "wallet_withdrawals"`);
    await queryRunner.query(`DROP TABLE "wallet_funding_accounts"`);
    await queryRunner.query(`DROP TYPE "wallet_withdrawal_status_enum"`);
    await queryRunner.query(`DROP TYPE "wallet_funding_account_status_enum"`);
  }
}
