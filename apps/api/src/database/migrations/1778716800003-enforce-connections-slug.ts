import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceConnectionsSlug1778716800003 implements MigrationInterface {
  name = 'EnforceConnectionsSlug1778716800003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE connections ALTER COLUMN slug SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_connections_slug_unique" ON connections (slug)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_connections_slug_unique"`,
    );
    await queryRunner.query(
      `ALTER TABLE connections ALTER COLUMN slug DROP NOT NULL`,
    );
  }
}
