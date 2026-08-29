import { AddAuthAuditFields1778716800019 } from './migrations/1778716800019-add-auth-audit-fields';

type MigrationQueryRunner = {
  query: (query: string) => Promise<void>;
};

const createQueryRunner = (): {
  queryRunner: MigrationQueryRunner;
  queries: string[];
} => {
  const queries: string[] = [];
  return {
    queryRunner: {
      query: async (statement: string): Promise<void> => {
        queries.push(statement);
      },
    },
    queries,
  };
};

describe('AddAuthAuditFields1778716800019', () => {
  it('adds the OWASP-required event attributes missing from audit_logs', async () => {
    const { queryRunner, queries } = createQueryRunner();
    const migration = new AddAuthAuditFields1778716800019();

    await migration.up(queryRunner as never);

    const joined = queries.join('\n');
    expect(joined).toContain('"ipAddress"');
    expect(joined).toContain('"userAgent"');
    expect(joined).toContain('"outcome"');
    expect(joined).toContain('"severity"');
  });

  it('releases the NOT NULL on environment so auth events can omit it', async () => {
    const { queryRunner, queries } = createQueryRunner();
    const migration = new AddAuthAuditFields1778716800019();

    await migration.up(queryRunner as never);

    expect(queries).toContain(
      'ALTER TABLE "audit_logs" ALTER COLUMN "environment" DROP NOT NULL',
    );
  });

  it('restores the original shape on down', async () => {
    const { queryRunner, queries } = createQueryRunner();
    const migration = new AddAuthAuditFields1778716800019();

    await migration.down(queryRunner as never);

    const joined = queries.join('\n');
    expect(joined).toContain('DROP COLUMN "ipAddress"');
    expect(joined).toContain('DROP COLUMN "userAgent"');
    expect(joined).toContain('DROP COLUMN "outcome"');
    expect(joined).toContain('DROP COLUMN "severity"');
    expect(joined).toContain(
      'ALTER TABLE "audit_logs" ALTER COLUMN "environment" SET NOT NULL',
    );
  });
});
