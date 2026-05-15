import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStorageKeyVersionAndCategoryToBackupJobs1778716800007
  implements MigrationInterface
{
  name = 'AddStorageKeyVersionAndCategoryToBackupJobs1778716800007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasVersion = await queryRunner.hasColumn(
      'backup_jobs',
      'storageKeyVersion',
    );
    if (!hasVersion) {
      await queryRunner.addColumn(
        'backup_jobs',
        new TableColumn({
          name: 'storageKeyVersion',
          type: 'integer',
          default: 1,
          isNullable: false,
        }),
      );
    }

    const hasCategory = await queryRunner.hasColumn('backup_jobs', 'category');
    if (!hasCategory) {
      await queryRunner.addColumn(
        'backup_jobs',
        new TableColumn({
          name: 'category',
          type: 'enum',
          enum: ['manual', 'hourly', 'daily', 'weekly', 'custom'],
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('backup_jobs', 'category');
    await queryRunner.query(
      `DROP TYPE IF EXISTS "backup_jobs_category_enum"`,
    );
    await queryRunner.dropColumn('backup_jobs', 'storageKeyVersion');
  }
}
