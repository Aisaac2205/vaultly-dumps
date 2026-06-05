import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRetentionToCronjobs1778716800010 implements MigrationInterface {
  name = 'AddRetentionToCronjobs1778716800010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasEnabled = await queryRunner.hasColumn('cronjobs', 'retentionEnabled');
    if (!hasEnabled) {
      await queryRunner.addColumn(
        'cronjobs',
        new TableColumn({
          name: 'retentionEnabled',
          type: 'boolean',
          default: false,
          isNullable: false,
        }),
      );
    }

    for (const name of [
      'retentionKeepLast',
      'retentionMaxAgeDays',
      'retentionMaxSizeMb',
    ]) {
      const exists = await queryRunner.hasColumn('cronjobs', name);
      if (!exists) {
        await queryRunner.addColumn(
          'cronjobs',
          new TableColumn({ name, type: 'integer', isNullable: true }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('cronjobs', 'retentionMaxSizeMb');
    await queryRunner.dropColumn('cronjobs', 'retentionMaxAgeDays');
    await queryRunner.dropColumn('cronjobs', 'retentionKeepLast');
    await queryRunner.dropColumn('cronjobs', 'retentionEnabled');
  }
}
