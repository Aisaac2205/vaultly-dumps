import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceCronjobsFrequency1778716800006
  implements MigrationInterface
{
  name = 'EnforceCronjobsFrequency1778716800006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE cronjobs ALTER COLUMN frequency SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE cronjobs ALTER COLUMN frequency DROP NOT NULL`,
    );
  }
}
