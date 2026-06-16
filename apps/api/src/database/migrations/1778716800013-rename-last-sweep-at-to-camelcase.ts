import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Renames the `last_sweep_at` column to `lastSweepAt` to match the entity
 * property name. The original migration (1778716800012) used snake_case
 * for the column name, but TypeORM is configured with the default (identity)
 * naming strategy, so it expects column names to match entity properties
 * exactly (camelCase). All other columns in this table follow that pattern
 * (`updatedAt`, `keepLast`, `maxAgeDays`, `maxTotalSizeMb`).
 *
 * This migration is a no-op on databases where the column was already created
 * with the correct camelCase name (e.g. fresh installs going forward).
 */
export class RenameLastSweepAtToCamelCase1778716800013
  implements MigrationInterface
{
  name = 'RenameLastSweepAtToCamelCase1778716800013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('manual_retention_settings');
    if (!table) return;

    const hasSnake = !!table.findColumnByName('last_sweep_at');
    const hasCamel = !!table.findColumnByName('lastSweepAt');

    if (hasSnake && !hasCamel) {
      await queryRunner.renameColumn(
        'manual_retention_settings',
        'last_sweep_at',
        'lastSweepAt',
      );
    }
    // If only lastSweepAt exists (fresh install with new migration): no-op.
    // If both exist somehow: defensive — leave as is, manual fix needed.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('manual_retention_settings');
    if (!table) return;

    const hasSnake = !!table.findColumnByName('last_sweep_at');
    const hasCamel = !!table.findColumnByName('lastSweepAt');

    if (hasCamel && !hasSnake) {
      await queryRunner.renameColumn(
        'manual_retention_settings',
        'lastSweepAt',
        'last_sweep_at',
      );
    }
  }
}
