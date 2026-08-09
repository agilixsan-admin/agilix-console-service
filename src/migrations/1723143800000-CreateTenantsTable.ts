import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantsTable1723143800000 implements MigrationInterface {
  public name = 'CreateTenantsTable1723143800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "tenant_status_enum" AS ENUM ('ACTIVE', 'LOCKED', 'SUSPENDED', 'EXPIRED')
    `);

    await queryRunner.query(`
      CREATE TYPE "plan_type_enum" AS ENUM ('BASIC', 'PRO', 'ENTERPRISE')
    `);

    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id"            UUID                  NOT NULL DEFAULT gen_random_uuid(),
        "business_name" VARCHAR(255)          NOT NULL,
        "owner_name"    VARCHAR(255)          NOT NULL,
        "owner_email"   VARCHAR(255)          NOT NULL,
        "owner_phone"   VARCHAR(20)                   DEFAULT NULL,
        "plan_type"     "plan_type_enum"      NOT NULL,
        "outlet_count"  INT                   NOT NULL,
        "status"        "tenant_status_enum"  NOT NULL DEFAULT 'ACTIVE',
        "expiry_date"   DATE                  NOT NULL,
        "notes"         TEXT                          DEFAULT NULL,
        "created_by"    UUID                  NOT NULL,
        "created_at"    TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
        "updated_at"    TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
        "deleted_at"    TIMESTAMPTZ                   DEFAULT NULL,

        CONSTRAINT "pk_tenants" PRIMARY KEY ("id"),
        CONSTRAINT "fk_tenants_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_tenants_status"       ON "tenants" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tenants_plan_type"    ON "tenants" ("plan_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tenants_owner_email"  ON "tenants" ("owner_email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tenants_expiry_date"  ON "tenants" ("expiry_date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tenants_expiry_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tenants_owner_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tenants_plan_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tenants_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "plan_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tenant_status_enum"`);
  }
}
