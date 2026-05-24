import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeAuditLogsImmutable1778716800008
  implements MigrationInterface
{
  name = 'MakeAuditLogsImmutable1778716800008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create a trigger that prevents UPDATE and DELETE on audit_logs.
    // This makes the table append-only regardless of DB user privileges.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'audit_logs is append-only: % operations are not allowed', TG_OP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER audit_logs_immutable
      BEFORE UPDATE OR DELETE ON audit_logs
      FOR EACH ROW
      EXECUTE FUNCTION prevent_audit_log_mutation();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER IF EXISTS audit_logs_immutable ON audit_logs');
    await queryRunner.query('DROP FUNCTION IF EXISTS prevent_audit_log_mutation');
  }
}
