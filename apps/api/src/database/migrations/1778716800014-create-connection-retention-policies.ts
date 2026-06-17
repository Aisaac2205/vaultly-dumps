import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateConnectionRetentionPolicies1778716800014
  implements MigrationInterface
{
  name = 'CreateConnectionRetentionPolicies1778716800014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('connection_retention_policies');
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: 'connection_retention_policies',
        columns: [
          { name: 'connectionId', type: 'uuid', isPrimary: true },
          {
            name: 'category',
            type: 'enum',
            enum: ['manual', 'hourly', 'daily', 'weekly', 'custom'],
            isPrimary: true,
          },
          { name: 'retentionDays', type: 'integer', isNullable: true },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
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
    await queryRunner.dropTable('connection_retention_policies', true);
  }
}
