import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UseStrowalletProvider1777158000000 implements MigrationInterface {
  name = 'UseStrowalletProvider1777158000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallet_funding_accounts" ALTER COLUMN "provider" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ALTER COLUMN "provider" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_top_ups" ALTER COLUMN "provider" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_funding_accounts" ALTER COLUMN "provider" TYPE text USING 'STROWALLET'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ALTER COLUMN "provider" TYPE text USING 'STROWALLET'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_top_ups" ALTER COLUMN "provider" TYPE text USING 'STROWALLET'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_webhook_events" ALTER COLUMN "provider" TYPE text USING 'STROWALLET'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."payment_provider_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_provider_enum" AS ENUM('STROWALLET')`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_funding_accounts" ALTER COLUMN "provider" TYPE "public"."payment_provider_enum" USING "provider"::"public"."payment_provider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ALTER COLUMN "provider" TYPE "public"."payment_provider_enum" USING "provider"::"public"."payment_provider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_top_ups" ALTER COLUMN "provider" TYPE "public"."payment_provider_enum" USING "provider"::"public"."payment_provider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_webhook_events" ALTER COLUMN "provider" TYPE "public"."payment_provider_enum" USING "provider"::"public"."payment_provider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_funding_accounts" ALTER COLUMN "provider" SET DEFAULT 'STROWALLET'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ALTER COLUMN "provider" SET DEFAULT 'STROWALLET'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_top_ups" ALTER COLUMN "provider" SET DEFAULT 'STROWALLET'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallet_funding_accounts" ALTER COLUMN "provider" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ALTER COLUMN "provider" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_top_ups" ALTER COLUMN "provider" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_funding_accounts" ALTER COLUMN "provider" TYPE text USING 'MONNIFY'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ALTER COLUMN "provider" TYPE text USING 'MONNIFY'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_top_ups" ALTER COLUMN "provider" TYPE text USING 'MONNIFY'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_webhook_events" ALTER COLUMN "provider" TYPE text USING 'MONNIFY'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."payment_provider_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_provider_enum" AS ENUM('MONNIFY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_funding_accounts" ALTER COLUMN "provider" TYPE "public"."payment_provider_enum" USING "provider"::"public"."payment_provider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ALTER COLUMN "provider" TYPE "public"."payment_provider_enum" USING "provider"::"public"."payment_provider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_top_ups" ALTER COLUMN "provider" TYPE "public"."payment_provider_enum" USING "provider"::"public"."payment_provider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_webhook_events" ALTER COLUMN "provider" TYPE "public"."payment_provider_enum" USING "provider"::"public"."payment_provider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_funding_accounts" ALTER COLUMN "provider" SET DEFAULT 'MONNIFY'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_withdrawals" ALTER COLUMN "provider" SET DEFAULT 'MONNIFY'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_top_ups" ALTER COLUMN "provider" SET DEFAULT 'MONNIFY'`,
    );
  }
}
