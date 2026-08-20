import type { MigrationInterface, QueryRunner } from 'typeorm';

export class FixDeliveryLifecycleStatuses1780000100000
  implements MigrationInterface
{
  name = 'FixDeliveryLifecycleStatuses1780000100000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "delivery_status_enum" ADD VALUE IF NOT EXISTS 'SELLER_SHIPS'`,
    );
    await queryRunner.query(
      `ALTER TYPE "delivery_status_enum" ADD VALUE IF NOT EXISTS 'INSPECTION'`,
    );
    await queryRunner.query(
      `ALTER TYPE "delivery_status_enum" ADD VALUE IF NOT EXISTS 'DISPATCH'`,
    );
  }

  async down(): Promise<void> {
    // PostgreSQL enum values cannot be removed safely in place. Keeping these
    // values is backward-compatible with the original delivery enum.
  }
}
