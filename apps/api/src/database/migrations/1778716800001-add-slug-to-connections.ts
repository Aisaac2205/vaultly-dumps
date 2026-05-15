import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSlugToConnections1778716800001 implements MigrationInterface {
  name = 'AddSlugToConnections1778716800001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('connections', 'slug');
    if (hasColumn) return;
    await queryRunner.addColumn(
      'connections',
      new TableColumn({
        name: 'slug',
        type: 'varchar',
        length: '120',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('connections', 'slug');
  }
}
