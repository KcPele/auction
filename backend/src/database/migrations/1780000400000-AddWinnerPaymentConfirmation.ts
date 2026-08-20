import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWinnerPaymentConfirmation1780000400000
  implements MigrationInterface
{
  name = 'AddWinnerPaymentConfirmation1780000400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "auctions" ADD COLUMN "winnerPaymentConfirmedAt" timestamptz',
    );
    await queryRunner.query(
      'ALTER TABLE "auctions" ADD COLUMN "winnerPaymentNote" text',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "auctions" DROP COLUMN "winnerPaymentNote"',
    );
    await queryRunner.query(
      'ALTER TABLE "auctions" DROP COLUMN "winnerPaymentConfirmedAt"',
    );
  }
}
