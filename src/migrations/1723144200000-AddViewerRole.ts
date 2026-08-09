import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddViewerRole1723144200000 implements MigrationInterface {
  public name = 'AddViewerRole1723144200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "user_role_enum" ADD VALUE IF NOT EXISTS 'VIEWER'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL tidak mendukung DROP VALUE dari enum.
    // Rollback dilakukan dengan membuat ulang enum tanpa VIEWER
    // dan migrasi data — ini hanya diperlukan jika tidak ada user dengan role VIEWER.
    await queryRunner.query(`
      DELETE FROM "users" WHERE "role" = 'VIEWER'
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "role" TYPE VARCHAR(50)
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('SUPER_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN')
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "role" TYPE "user_role_enum" USING "role"::"user_role_enum"
    `);
  }
}
