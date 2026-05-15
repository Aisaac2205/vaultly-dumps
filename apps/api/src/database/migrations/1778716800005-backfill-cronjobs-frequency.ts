import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillCronjobsFrequency1778716800005
  implements MigrationInterface
{
  name = 'BackfillCronjobsFrequency1778716800005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE cronjobs SET frequency = 'custom' WHERE frequency IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE cronjobs SET frequency = NULL`);
  }
}
