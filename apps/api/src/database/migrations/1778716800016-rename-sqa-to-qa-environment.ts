import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSqaToQaEnvironment1778716800016 implements MigrationInterface {
  name = 'RenameSqaToQaEnvironment1778716800016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."restore_jobs_targetenvironment_enum" RENAME VALUE 'sqa' TO 'qa'`);
    await queryRunner.query(`ALTER TYPE "public"."backup_jobs_environment_enum" RENAME VALUE 'sqa' TO 'qa'`);
    await queryRunner.query(`ALTER TYPE "public"."audit_logs_environment_enum" RENAME VALUE 'sqa' TO 'qa'`);
    await queryRunner.query(`ALTER TYPE "public"."connections_environment_enum" RENAME VALUE 'sqa' TO 'qa'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."restore_jobs_targetenvironment_enum" RENAME VALUE 'qa' TO 'sqa'`);
    await queryRunner.query(`ALTER TYPE "public"."backup_jobs_environment_enum" RENAME VALUE 'qa' TO 'sqa'`);
    await queryRunner.query(`ALTER TYPE "public"."audit_logs_environment_enum" RENAME VALUE 'qa' TO 'sqa'`);
    await queryRunner.query(`ALTER TYPE "public"."connections_environment_enum" RENAME VALUE 'qa' TO 'sqa'`);
  }
}
