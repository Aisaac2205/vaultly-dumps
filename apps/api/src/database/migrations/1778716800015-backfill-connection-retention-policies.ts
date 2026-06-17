import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Back-fill connection_retention_policies from:
 *  1. cronjobs.retentionMaxAgeDays (where retentionEnabled = true)
 *  2. manual_retention_settings.maxAgeDays (where enabled = true)
 *
 * Only age-based retention is migrated; keepLast / maxTotalSizeMb are dropped
 * because the new model uses a single "retentionDays" value per category.
 */
export class BackfillConnectionRetentionPolicies1778716800015
  implements MigrationInterface
{
  name = 'BackfillConnectionRetentionPolicies1778716800015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Migrate cronjob retention policies.
    // Note: cronjobs.connectionId is varchar; our table expects uuid.
    await queryRunner.query(`
      INSERT INTO connection_retention_policies ("connectionId", category, "retentionDays", "createdAt", "updatedAt")
      SELECT
        c."connectionId"::uuid,
        CASE c.frequency
          WHEN 'hourly'  THEN 'hourly'
          WHEN 'daily'   THEN 'daily'
          WHEN 'weekly'  THEN 'weekly'
          WHEN 'custom'  THEN 'custom'
        END::text AS category,
        c."retentionMaxAgeDays",
        NOW(),
        NOW()
      FROM cronjobs c
      WHERE c."retentionEnabled" = true
        AND c."retentionMaxAgeDays" IS NOT NULL
      ON CONFLICT ("connectionId", category) DO UPDATE
        SET "retentionDays" = EXCLUDED."retentionDays",
            "updatedAt"     = NOW();
    `);

    // 2. Migrate manual retention settings → one row per connection.
    const manualSettings = await queryRunner.query(
      `SELECT "maxAgeDays", enabled FROM manual_retention_settings WHERE id = 1`,
    ) as Array<{ maxAgeDays: number | null; enabled: boolean }>;

    const settings = manualSettings[0];
    if (settings?.enabled && settings.maxAgeDays != null) {
      await queryRunner.query(`
        INSERT INTO connection_retention_policies ("connectionId", category, "retentionDays", "createdAt", "updatedAt")
        SELECT id, 'manual', ${settings.maxAgeDays}, NOW(), NOW()
        FROM connections
        ON CONFLICT ("connectionId", category) DO UPDATE
          SET "retentionDays" = EXCLUDED."retentionDays",
              "updatedAt"     = NOW();
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM connection_retention_policies WHERE category IN ('manual','hourly','daily','weekly','custom')`,
    );
  }
}
