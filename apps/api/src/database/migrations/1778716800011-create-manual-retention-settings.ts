import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateManualRetentionSettings1778716800011
  implements MigrationInterface
{
  name = 'CreateManualRetentionSettings1778716800011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('manual_retention_settings');
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: 'manual_retention_settings',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true, default: 1 },
          { name: 'enabled', type: 'boolean', default: false, isNullable: false },
          { name: 'keepLast', type: 'integer', isNullable: true },
          { name: 'maxAgeDays', type: 'integer', isNullable: true },
          { name: 'maxTotalSizeMb', type: 'integer', isNullable: true },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('manual_retention_settings', true);
  }
}
