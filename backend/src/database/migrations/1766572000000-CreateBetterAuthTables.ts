import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBetterAuthTables1766572000000
  implements MigrationInterface
{
  name = 'CreateBetterAuthTables1766572000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL`,
    );
    await queryRunner.query(`
      CREATE TABLE "auth_users" (
        "id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
        "name" text NOT NULL,
        "email" text NOT NULL UNIQUE,
        "email_verified" boolean NOT NULL,
        "image" text,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "role" text,
        "banned" boolean,
        "banReason" text,
        "banExpires" timestamptz,
        "phone" text NOT NULL UNIQUE,
        "first_name" text NOT NULL,
        "last_name" text NOT NULL,
        "app_role" text,
        "nin" text
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "auth_sessions" (
        "id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
        "expires_at" timestamptz NOT NULL,
        "token" text NOT NULL UNIQUE,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL,
        "ip_address" text,
        "user_agent" text,
        "user_id" uuid NOT NULL,
        "impersonatedBy" text,
        CONSTRAINT "FK_auth_sessions_user"
          FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "auth_accounts" (
        "id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
        "account_id" text NOT NULL,
        "provider_id" text NOT NULL,
        "user_id" uuid NOT NULL,
        "access_token" text,
        "refresh_token" text,
        "id_token" text,
        "access_token_expires_at" timestamptz,
        "refresh_token_expires_at" timestamptz,
        "scope" text,
        "password" text,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL,
        CONSTRAINT "FK_auth_accounts_user"
          FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "auth_verifications" (
        "id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
        "identifier" text NOT NULL,
        "value" text NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "auth_accounts_user_id_idx" ON "auth_accounts" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "auth_verifications_identifier_idx" ON "auth_verifications" ("identifier")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "auth_verifications_identifier_idx"`);
    await queryRunner.query(`DROP INDEX "auth_accounts_user_id_idx"`);
    await queryRunner.query(`DROP INDEX "auth_sessions_user_id_idx"`);
    await queryRunner.query(`DROP TABLE "auth_verifications"`);
    await queryRunner.query(`DROP TABLE "auth_accounts"`);
    await queryRunner.query(`DROP TABLE "auth_sessions"`);
    await queryRunner.query(`DROP TABLE "auth_users"`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "passwordHash" SET NOT NULL`,
    );
  }
}
