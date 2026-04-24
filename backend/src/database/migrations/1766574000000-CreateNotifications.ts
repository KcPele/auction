import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1766574000000 implements MigrationInterface {
  name = 'CreateNotifications1766574000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "notification_audience_enum" AS ENUM ('USER', 'ADMIN')
    `);
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM (
        'LISTING_SUBMITTED',
        'LISTING_APPROVED',
        'LISTING_REJECTED',
        'AUCTION_STARTED',
        'OUTBID',
        'AUCTION_WON',
        'PAYMENT_DUE',
        'SYSTEM'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "audience" "notification_audience_enum" NOT NULL,
        "recipientId" uuid,
        "type" "notification_type_enum" NOT NULL,
        "title" varchar(160) NOT NULL,
        "message" text NOT NULL,
        "data" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_notifications_recipient"
          FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "notification_reads" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "notificationId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "readAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_notification_reads_notification"
          FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notification_reads_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_notification_reads_notification_user"
          UNIQUE ("notificationId", "userId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_recipient_created" ON "notifications" ("recipientId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_admin_created" ON "notifications" ("audience", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_reads_user" ON "notification_reads" ("userId")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_notification_reads_user"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_admin_created"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_recipient_created"`);
    await queryRunner.query(`DROP TABLE "notification_reads"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "notification_type_enum"`);
    await queryRunner.query(`DROP TYPE "notification_audience_enum"`);
  }
}
