import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailTemplatesTable1723144300000 implements MigrationInterface {
  public name = 'CreateEmailTemplatesTable1723144300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "email_templates" (
        "id"         UUID          NOT NULL DEFAULT gen_random_uuid(),
        "subject"    VARCHAR(500)  NOT NULL,
        "slug"       VARCHAR(100)  NOT NULL,
        "template"   TEXT          NOT NULL,
        "created_at" TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_templates" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_email_templates_slug" UNIQUE ("slug")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "email_templates"`);
  }
}
