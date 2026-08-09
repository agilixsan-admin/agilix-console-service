import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateUsersTable1723143600000 implements MigrationInterface {
  public name = 'CreateUsersTable1723143600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_role enum type
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM (
        'SUPER_ADMIN',
        'FINANCE_ADMIN',
        'SUPPORT_ADMIN'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"             UUID                NOT NULL DEFAULT gen_random_uuid(),
        "full_name"      VARCHAR(255)        NOT NULL,
        "email"          VARCHAR(255)        NOT NULL,
        "password_hash"  VARCHAR(255)        NOT NULL,
        "role"           "user_role_enum"    NOT NULL,
        "is_active"      BOOLEAN             NOT NULL DEFAULT TRUE,
        "last_login_at"  TIMESTAMPTZ                 DEFAULT NULL,
        "created_at"     TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
        "updated_at"     TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
        "deleted_at"     TIMESTAMPTZ                 DEFAULT NULL,

        CONSTRAINT "pk_users" PRIMARY KEY ("id"),
        CONSTRAINT "uq_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_email" ON "users" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_role" ON "users" ("role")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_is_active" ON "users" ("is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_active_not_deleted"
        ON "users" ("email")
        WHERE "is_active" = TRUE AND "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first, then table, then enum type
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_users_active_not_deleted"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_role"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_email"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
