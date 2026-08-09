import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1723144100000 implements MigrationInterface {
  public name = 'CreateNotificationsTable1723144100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum"   AS ENUM ('WELCOME_EMAIL', 'INVOICE_EMAIL', 'REMINDER_EMAIL', 'PAYMENT_CONFIRMATION')
    `);
    await queryRunner.query(`
      CREATE TYPE "notification_status_enum" AS ENUM ('PENDING', 'SENT', 'FAILED')
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id"             UUID                        NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"      UUID                        NOT NULL,
        "type"           "notification_type_enum"    NOT NULL,
        "recipient"      VARCHAR(255)                NOT NULL,
        "subject"        VARCHAR(500)                NOT NULL,
        "content"        TEXT                        NOT NULL,
        "status"         "notification_status_enum"  NOT NULL DEFAULT 'PENDING',
        "sent_at"        TIMESTAMPTZ                         DEFAULT NULL,
        "failure_reason" TEXT                                DEFAULT NULL,
        "created_at"     TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),

        CONSTRAINT "pk_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "fk_notifications_tenant_id"
          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_notifications_tenant_id"  ON "notifications" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_status"     ON "notifications" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_type"       ON "notifications" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_created_at" ON "notifications" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_notifications_created_at"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_status"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_notifications_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum"`);
  }
}
