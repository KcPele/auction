import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentAccountSettings1766620000000
  implements MigrationInterface
{
  name = 'CreatePaymentAccountSettings1766620000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "payment_account_settings" (
        "id" varchar(32) PRIMARY KEY,
        "bankName" varchar(120) NOT NULL,
        "accountNumber" varchar(32) NOT NULL,
        "accountName" varchar(160) NOT NULL,
        "updatedById" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_payment_account_settings_updated_by"
          FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "payment_account_settings"`);
  }
}
