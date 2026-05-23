import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSupportTables1779400000000 implements MigrationInterface {
  name = 'CreateSupportTables1779400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_conversation_state_enum') THEN
          CREATE TYPE "support_conversation_state_enum" AS ENUM (
            'AI_ACTIVE',
            'WAITING_ADMIN',
            'ADMIN_ACTIVE',
            'RESOLVED'
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_message_role_enum') THEN
          CREATE TYPE "support_message_role_enum" AS ENUM (
            'USER',
            'AI',
            'ADMIN',
            'SYSTEM',
            'TOOL'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_conversations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "state" "support_conversation_state_enum" NOT NULL DEFAULT 'AI_ACTIVE',
        "subject" varchar(200),
        "assignedAdminId" uuid,
        "handoffReason" text,
        "lastMessageAt" timestamptz,
        "userLastReadAt" timestamptz,
        "adminLastReadAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt" timestamptz NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_support_conversations_user" ON "support_conversations" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_support_conversations_state" ON "support_conversations" ("state")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_messages" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "conversationId" uuid NOT NULL REFERENCES "support_conversations"("id") ON DELETE CASCADE,
        "role" "support_message_role_enum" NOT NULL,
        "authorId" uuid,
        "content" text NOT NULL,
        "toolCalls" jsonb,
        "model" varchar(120),
        "createdAt" timestamptz NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_support_messages_conv" ON "support_messages" ("conversationId", "createdAt")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_ai_settings" (
        "id" varchar(32) PRIMARY KEY DEFAULT 'default',
        "model" varchar(200) NOT NULL,
        "temperature" numeric(3,2) NOT NULL DEFAULT 0.2,
        "maxOutputTokens" integer NOT NULL DEFAULT 800,
        "systemPromptOverride" text,
        "enabled" boolean NOT NULL DEFAULT true,
        "updatedAt" timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    // Seed a default row so the admin settings screen always renders.
    await queryRunner.query(`
      INSERT INTO "support_ai_settings" ("id", "model", "temperature", "maxOutputTokens", "enabled")
      VALUES ('default', 'xiaomi/mimo-v2-flash', 0.2, 800, true)
      ON CONFLICT ("id") DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "support_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_conversations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_ai_settings"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "support_message_role_enum"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "support_conversation_state_enum"`,
    );
  }
}
