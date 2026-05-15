import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFrequencyToCronjobs1778716800004 implements MigrationInterface {
  name = 'AddFrequencyToCronjobs1778716800004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('cronjobs', 'frequency');
    if (hasColumn) return;
    await queryRunner.addColumn(
      'cronjobs',
      new TableColumn({
        name: 'frequency',
        type: 'enum',
        enum: ['hourly', 'daily', 'weekly', 'custom'],
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('cronjobs', 'frequency');
    await queryRunner.query(`DROP TYPE IF EXISTS "cronjobs_frequency_enum"`);
  }
}
