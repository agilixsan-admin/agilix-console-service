import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePosDevicesTable1723144000000 implements MigrationInterface {
  public name = 'CreatePosDevicesTable1723144000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "device_status_enum" AS ENUM ('ONLINE', 'OFFLINE', 'LOCKED')
    `);

    await queryRunner.query(`
      CREATE TABLE "pos_devices" (
        "id"           UUID                  NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"    UUID                  NOT NULL,
        "device_code"  VARCHAR(50)           NOT NULL,
        "device_name"  VARCHAR(255)          NOT NULL,
        "last_seen_at" TIMESTAMPTZ                   DEFAULT NULL,
        "status"       "device_status_enum"  NOT NULL DEFAULT 'OFFLINE',
        "is_locked"    BOOLEAN               NOT NULL DEFAULT FALSE,
        "created_at"   TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
        "updated_at"   TIMESTAMPTZ           NOT NULL DEFAULT NOW(),

        CONSTRAINT "pk_pos_devices"             PRIMARY KEY ("id"),
        CONSTRAINT "uq_pos_devices_device_code" UNIQUE ("device_code"),
        CONSTRAINT "fk_pos_devices_tenant_id"
          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_pos_devices_tenant_id"    ON "pos_devices" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_pos_devices_status"       ON "pos_devices" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_pos_devices_last_seen_at" ON "pos_devices" ("last_seen_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_pos_devices_last_seen_at"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_pos_devices_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_pos_devices_tenant_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pos_devices"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "device_status_enum"`);
  }
}
