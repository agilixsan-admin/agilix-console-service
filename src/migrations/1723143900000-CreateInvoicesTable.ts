import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvoicesTable1723143900000 implements MigrationInterface {
  public name = 'CreateInvoicesTable1723143900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "invoice_status_enum" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED')
    `);

    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id"             UUID                   NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"      UUID                   NOT NULL,
        "invoice_number" VARCHAR(50)            NOT NULL,
        "amount"         NUMERIC(12,2)          NOT NULL,
        "billing_period" VARCHAR(7)             NOT NULL,
        "due_date"       DATE                   NOT NULL,
        "paid_at"        TIMESTAMPTZ                    DEFAULT NULL,
        "status"         "invoice_status_enum"  NOT NULL DEFAULT 'PENDING',
        "notes"          TEXT                           DEFAULT NULL,
        "reminder_sent_at"     TIMESTAMPTZ            DEFAULT NULL,
        "overdue_notified_at"  TIMESTAMPTZ            DEFAULT NULL,
        "overdue_follow_up_at" TIMESTAMPTZ            DEFAULT NULL,
        "created_at"     TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
        "updated_at"     TIMESTAMPTZ            NOT NULL DEFAULT NOW(),

        CONSTRAINT "pk_invoices"             PRIMARY KEY ("id"),
        CONSTRAINT "uq_invoices_invoice_number" UNIQUE ("invoice_number"),
        CONSTRAINT "fk_invoices_tenant_id"
          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_invoices_tenant_id"      ON "invoices" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_invoices_status"         ON "invoices" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_invoices_due_date"       ON "invoices" ("due_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_invoices_billing_period" ON "invoices" ("billing_period")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_invoices_billing_period"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_invoices_due_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_invoices_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_invoices_tenant_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoice_status_enum"`);
  }
}
