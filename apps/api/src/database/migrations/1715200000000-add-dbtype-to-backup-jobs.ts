import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDbtypeToBackupJobs1715200000000 implements MigrationInterface {
  name = 'AddDbtypeToBackupJobs1715200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('backup_jobs', 'dbType');
    if (!hasColumn) {
      await queryRunner.addColumn(
        'backup_jobs',
        new TableColumn({
          name: 'dbType',
          type: 'enum',
          enum: ['postgres', 'mysql'],
          isNullable: true,
        }),
      );
    }

    // Backfill: set dbType from the related connection.
    // Two casts needed:
    // 1. c."id"::text — connections.id is uuid, backup_jobs.connectionId is varchar.
    // 2. c."dbType"::text::backup_jobs_dbtype_enum — TypeORM generates a separate
    //    enum type per column (connections_dbtype_enum vs backup_jobs_dbtype_enum),
    //    so even though they share the same values, Postgres treats them as
    //    incompatible types. Round-trip through text to coerce.
    await queryRunner.query(`
      UPDATE backup_jobs bj
      SET "dbType" = c."dbType"::text::backup_jobs_dbtype_enum
      FROM connections c
      WHERE bj."connectionId" = c."id"::text
        AND bj."dbType" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('backup_jobs', 'dbType');
  }
}
