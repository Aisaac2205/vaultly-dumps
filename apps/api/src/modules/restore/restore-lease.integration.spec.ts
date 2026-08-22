import { DataSource } from 'typeorm';
import { CreateRestoreLeases1778716800018 } from '../../database/migrations/1778716800018-create-restore-leases';
import { RestoreLeaseRepository } from './restore-lease.repository';

function resolveTestDatabaseUrl(): string | null {
  const value = process.env.RESTORE_LEASE_TEST_DATABASE_URL;
  if (!value) return null;

  const url = new URL(value);
  const isTestDatabase =
    (url.protocol === 'postgres:' || url.protocol === 'postgresql:') &&
    url.hostname === 'localhost' &&
    url.port === '5434' &&
    url.pathname === '/testdb' &&
    url.username === 'test_user';

  if (!isTestDatabase) {
    throw new Error('RESTORE_LEASE_TEST_DATABASE_URL must target the local test database');
  }

  return value;
}

const databaseUrl = resolveTestDatabaseUrl();
const integration = databaseUrl ? describe : describe.skip;
const testDatabaseUrl = databaseUrl ?? '';

integration('restore lease PostgreSQL integration', () => {
  const firstDataSource = new DataSource({ type: 'postgres', url: testDatabaseUrl });
  const secondDataSource = new DataSource({ type: 'postgres', url: testDatabaseUrl });
  let firstRepository: RestoreLeaseRepository;
  let secondRepository: RestoreLeaseRepository;
  const migration = new CreateRestoreLeases1778716800018();
  const target = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    await firstDataSource.initialize();
    await secondDataSource.initialize();
    const runner = firstDataSource.createQueryRunner();
    await runner.connect();
    try {
      await runner.query('DROP TABLE IF EXISTS restore_leases');
      await migration.up(runner);
    } finally {
      await runner.release();
    }
    firstRepository = new RestoreLeaseRepository(firstDataSource);
    secondRepository = new RestoreLeaseRepository(secondDataSource);
  });

  beforeEach(async () => {
    await firstDataSource.query('DELETE FROM restore_leases');
  });

  afterAll(async () => {
    try {
      if (firstDataSource.isInitialized) {
        const runner = firstDataSource.createQueryRunner();
        await runner.connect();
        try {
          await migration.down(runner);
        } finally {
          await runner.release();
        }
      }
    } finally {
      if (secondDataSource.isInitialized) await secondDataSource.destroy();
      if (firstDataSource.isInitialized) await firstDataSource.destroy();
    }
  });

  it('allows exactly one concurrent target lease winner', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const results = await Promise.all([
      firstRepository.tryAcquire(target, '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', expiresAt),
      secondRepository.tryAcquire(target, '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000202', expiresAt),
    ]);

    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it('takes over expired leases and rejects the previous owner', async () => {
    const firstJob = '00000000-0000-0000-0000-000000000101';
    const firstToken = '00000000-0000-0000-0000-000000000201';
    const secondJob = '00000000-0000-0000-0000-000000000102';
    const secondToken = '00000000-0000-0000-0000-000000000202';
    const expiresAt = new Date(Date.now() + 60_000);

    expect(await firstRepository.tryAcquire(target, firstJob, firstToken, new Date(Date.now() - 1_000))).toBe(true);
    expect(await secondRepository.tryAcquire(target, secondJob, secondToken, expiresAt)).toBe(true);
    expect(await firstRepository.renew(target, firstJob, firstToken, expiresAt)).toBe(false);
    expect(await firstRepository.release(target, firstJob, firstToken)).toBe(false);
    expect(await secondRepository.renew(target, secondJob, secondToken, expiresAt)).toBe(true);
    expect(await secondRepository.release(target, secondJob, secondToken)).toBe(true);
  });
});
