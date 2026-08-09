import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1723143700000 implements MigrationInterface {
  public name = 'CreateAuditLogsTable1723143700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"          UUID          NOT NULL DEFAULT gen_random_uuid(),
        "actor_id"    UUID          NOT NULL,
        "tenant_id"   UUID                  DEFAULT NULL,
        "action"      VARCHAR(100)  NOT NULL,
        "target_type" VARCHAR(100)  NOT NULL,
        "target_id"   UUID                  DEFAULT NULL,
        "ip_address"  VARCHAR(45)           DEFAULT NULL,
        "user_agent"  TEXT                  DEFAULT NULL,
        "metadata"    JSONB                 DEFAULT NULL,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

        CONSTRAINT "pk_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "fk_audit_logs_actor_id"
          FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_actor_id"  ON "audit_logs" ("actor_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_tenant_id" ON "audit_logs" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_action"    ON "audit_logs" ("action")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_action"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_tenant_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_actor_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
  }
}
