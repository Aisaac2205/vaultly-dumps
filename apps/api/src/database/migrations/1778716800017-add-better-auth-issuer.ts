import { MigrationInterface } from 'typeorm';

type MigrationQueryRunner = {
  query(query: string): Promise<void>;
};

export class AddBetterAuthIssuer1778716800017 implements MigrationInterface {
  name = 'AddBetterAuthIssuer1778716800017';

  public async up(queryRunner: MigrationQueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "account" ADD "issuer" text');
    await queryRunner.query(
      'UPDATE "account" SET "issuer" = \'local:credential\', "accountId" = "userId" WHERE "providerId" = \'credential\'',
    );
    await queryRunner.query(
      'ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "account" ("issuer", "accountId")',
    );
  }

  public async down(_queryRunner: MigrationQueryRunner): Promise<void> {
    throw new Error(
      'Cannot safely revert Better Auth issuer identity migration while Better Auth 1.7 is deployed',
    );
  }
}
