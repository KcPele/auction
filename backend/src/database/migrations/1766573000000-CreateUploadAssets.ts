import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUploadAssets1766573000000 implements MigrationInterface {
  name = 'CreateUploadAssets1766573000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "upload_purpose_enum" AS ENUM (
        'LISTING_PHOTO',
        'LISTING_VIDEO',
        'PROOF_DOCUMENT',
        'INSPECTION_MEDIA'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "upload_resource_type_enum" AS ENUM (
        'IMAGE',
        'VIDEO',
        'DOCUMENT'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "upload_assets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "ownerId" uuid NOT NULL,
        "purpose" "upload_purpose_enum" NOT NULL,
        "category" "listing_category_enum",
        "resourceType" "upload_resource_type_enum" NOT NULL,
        "originalName" varchar(255) NOT NULL,
        "mimeType" varchar(120) NOT NULL,
        "sizeBytes" integer NOT NULL,
        "provider" varchar(32) NOT NULL,
        "providerPublicId" varchar(255) NOT NULL,
        "url" text NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_upload_assets_owner"
          FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_upload_assets_owner_created" ON "upload_assets" ("ownerId", "createdAt")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_upload_assets_owner_created"`);
    await queryRunner.query(`DROP TABLE "upload_assets"`);
    await queryRunner.query(`DROP TYPE "upload_resource_type_enum"`);
    await queryRunner.query(`DROP TYPE "upload_purpose_enum"`);
  }
}
