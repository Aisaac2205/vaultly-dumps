import { Pool } from 'pg';
import { DataSource } from 'typeorm';
import { AddAuthAuditFields1778716800019 } from '../../database/migrations/1778716800019-add-auth-audit-fields';
import { createAuthAuditHook } from './auth-audit-hook';

function resolveTestDatabaseUrl(): string | null {
  const value = process.env.AUDIT_TEST_DATABASE_URL;
  if (!value) return null;

  const url = new URL(value);
  const isTestDatabase =
    (url.protocol === 'postgres:' || url.protocol === 'postgresql:') &&
    url.hostname === 'localhost' &&
    url.port === '5434' &&
    url.pathname === '/testdb' &&
    url.username === 'test_user';

  if (!isTestDatabase) {
    throw new Error(
      'AUDIT_TEST_DATABASE_URL must target the local test database',
    );
  }

  return value;
}

const databaseUrl = resolveTestDatabaseUrl();
const integration = databaseUrl ? describe : describe.skip;
const testDatabaseUrl = databaseUrl ?? '';

interface AuditRow {
  action: string;
  userId: string;
  username: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, string> | null;
  environment: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  outcome: string;
  severity: string;
}

integration('auth audit PostgreSQL integration', () => {
  const dataSource = new DataSource({ type: 'postgres', url: testDatabaseUrl });
  const pool = new Pool({ connectionString: testDatabaseUrl });

  const hook = createAuthAuditHook(async (sql, params) => {
    await pool.query(sql, [...params]);
  });

  beforeAll(async () => {
    await dataSource.initialize();
    const runner = dataSource.createQueryRunner();

    await runner.query('DROP TABLE IF EXISTS "audit_logs"');
    await runner.query(
      'DROP TYPE IF EXISTS "public"."audit_logs_environment_enum"',
    );
    await runner.query(
      `CREATE TYPE "public"."audit_logs_environment_enum" AS ENUM('prod', 'dev', 'qa')`,
    );
    // Mirrors the shape InitialSchema leaves behind, so the migration under
    // test runs against the same starting point it will meet in production.
    await runner.query(`CREATE TABLE "audit_logs" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "action" character varying NOT NULL,
      "userId" character varying NOT NULL,
      "username" character varying NOT NULL,
      "resourceType" character varying NOT NULL,
      "resourceId" character varying NOT NULL,
      "metadata" jsonb,
      "environment" "public"."audit_logs_environment_enum" NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "PK_audit_logs_integration" PRIMARY KEY ("id"))`);

    await new AddAuthAuditFields1778716800019().up(runner);
    await runner.release();
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      const runner = dataSource.createQueryRunner();
      await runner.query('DROP TABLE IF EXISTS "audit_logs"');
      await runner.query(
        'DROP TYPE IF EXISTS "public"."audit_logs_environment_enum"',
      );
      await runner.release();
      await dataSource.destroy();
    }
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE "audit_logs"');
  });

  it('lands a rejected sign-in in audit_logs with the attributes OWASP requires', async () => {
    await hook({
      path: '/sign-in/email',
      body: { email: 'someone@example.com', password: 'hunter2' },
      headers: new Headers({
        'x-real-ip': '203.0.113.7',
        'user-agent': 'Mozilla/5.0',
      }),
      context: { returned: new Error('Invalid credentials') },
    });

    const { rows } = await pool.query<AuditRow>('SELECT * FROM "audit_logs"');

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      action: 'auth.sign-in.email',
      userId: 'anonymous',
      username: 'someone@example.com',
      resourceType: 'Auth',
      resourceId: 'sign-in/email',
      ipAddress: '203.0.113.7',
      userAgent: 'Mozilla/5.0',
      outcome: 'failure',
      severity: 'medium',
    });
    // The column is nullable precisely so authentication events stay out of
    // the ERP environment filter on the audit list.
    expect(rows[0].environment).toBeNull();
  });

  it('records a successful sign-in against the authenticated user', async () => {
    await hook({
      path: '/sign-in/email',
      body: { email: 'someone@example.com' },
      headers: new Headers({ 'x-real-ip': '203.0.113.7' }),
      context: {
        returned: { token: 'ok' },
        newSession: { user: { id: 'user-1', email: 'someone@example.com' } },
      },
    });

    const { rows } = await pool.query<AuditRow>('SELECT * FROM "audit_logs"');

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      userId: 'user-1',
      outcome: 'success',
      severity: 'low',
    });
  });

  it('writes nothing for the session reads the SPA polls', async () => {
    await hook({
      path: '/get-session',
      headers: new Headers({ 'x-real-ip': '203.0.113.7' }),
      context: { returned: { session: {} } },
    });

    const { rows } = await pool.query('SELECT * FROM "audit_logs"');

    expect(rows).toHaveLength(0);
  });

  it('keeps authentication working when the audit write is rejected', async () => {
    const brokenHook = createAuthAuditHook(async () => {
      await pool.query('INSERT INTO "audit_logs" ("action") VALUES ($1)', [
        'missing-required-columns',
      ]);
    });

    await expect(
      brokenHook({
        path: '/sign-in/email',
        body: { email: 'someone@example.com' },
        headers: new Headers({ 'x-real-ip': '203.0.113.7' }),
        context: { returned: new Error('Invalid credentials') },
      }),
    ).resolves.toBeUndefined();

    const { rows } = await pool.query('SELECT * FROM "audit_logs"');
    expect(rows).toHaveLength(0);
  });
});
