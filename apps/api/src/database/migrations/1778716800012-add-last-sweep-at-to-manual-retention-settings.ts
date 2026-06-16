import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLastSweepAtToManualRetentionSettings1778716800012
  implements MigrationInterface
{
  name = 'AddLastSweepAtToManualRetentionSettings1778716800012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('manual_retention_settings');
    if (table && !table.findColumnByName('last_sweep_at')) {
      await queryRunner.addColumn(
        'manual_retention_settings',
        new TableColumn({
          name: 'last_sweep_at',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('manual_retention_settings');
    if (table?.findColumnByName('last_sweep_at')) {
      await queryRunner.dropColumn('manual_retention_settings', 'last_sweep_at');
    }
  }
}
