import { ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { encrypt } from '../../common/utils/encryption';
import { ConnectionEntity } from '../../database/entities/connection.entity';
import { Environment } from '../../database/enums/environment.enum';
import { RestoreJobEntity } from '../../database/entities/restore-job.entity';
import { CreateRestoreLeases1778716800018 } from '../../database/migrations/1778716800018-create-restore-leases';
import { ConnectionsRepository } from '../connections/connections.repository';
import { ConnectionsService } from '../connections/connections.service';
import { RestoreLeaseRepository } from './restore-lease.repository';
import { RestoreExecutionOwnershipService } from './restore-execution-ownership.service';
import { RestoreRepository } from './restore.repository';

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
  const firstDataSource = new DataSource({
    type: 'postgres',
    url: testDatabaseUrl,
    entities: [ConnectionEntity, RestoreJobEntity],
  });
  const secondDataSource = new DataSource({
    type: 'postgres',
    url: testDatabaseUrl,
    entities: [ConnectionEntity, RestoreJobEntity],
  });
  let firstRepository: RestoreLeaseRepository;
  let secondRepository: RestoreLeaseRepository;
  let firstRestoreRepository: RestoreRepository;
  let secondRestoreRepository: RestoreRepository;
  let firstOwnershipService: RestoreExecutionOwnershipService;
  let secondOwnershipService: RestoreExecutionOwnershipService;
  const migration = new CreateRestoreLeases1778716800018();
  const target = '00000000-0000-0000-0000-000000000001';
  const targetTwo = '00000000-0000-0000-0000-000000000002';
  let createdRestoreJobs = false;
  let createdConnections = false;

  beforeAll(async () => {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    await firstDataSource.initialize();
    await secondDataSource.initialize();
    const runner = firstDataSource.createQueryRunner();
    await runner.connect();
    try {
      const [restoreJobs] = await runner.query("SELECT to_regclass('public.restore_jobs') AS name");
      const [connections] = await runner.query("SELECT to_regclass('public.connections') AS name");
      const [leases] = await runner.query("SELECT to_regclass('public.restore_leases') AS name");
      if (restoreJobs.name || connections.name || leases.name) {
        throw new Error('Restore queue integration test requires an empty local test database');
      }
      await runner.query(`CREATE TABLE restore_jobs (
        id uuid PRIMARY KEY,
        "sourceBackupId" varchar NULL,
        "r2Key" varchar NULL,
        "targetConnectionId" uuid NOT NULL,
        "targetEnvironment" varchar NOT NULL,
        status varchar NOT NULL,
        "isDryRun" boolean NOT NULL,
        "startedAt" timestamp NOT NULL,
        "completedAt" timestamp NULL,
        "errorMessage" text NULL,
        "triggeredBy" varchar NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )`);
      createdRestoreJobs = true;
      await runner.query(`CREATE TABLE connections (
        id uuid PRIMARY KEY,
        name varchar NOT NULL,
        slug varchar NOT NULL,
        environment varchar NOT NULL,
        "dbType" varchar NOT NULL,
        host varchar NOT NULL,
        port integer NOT NULL,
        database varchar NOT NULL,
        username varchar NOT NULL,
        password varchar NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )`);
      createdConnections = true;
      await migration.up(runner);
    } finally {
      await runner.release();
    }
    firstRepository = new RestoreLeaseRepository(firstDataSource);
    secondRepository = new RestoreLeaseRepository(secondDataSource);
    firstRestoreRepository = new RestoreRepository(
      firstDataSource.getRepository(RestoreJobEntity),
      firstDataSource,
    );
    secondRestoreRepository = new RestoreRepository(
      secondDataSource.getRepository(RestoreJobEntity),
      secondDataSource,
    );
    firstOwnershipService = new RestoreExecutionOwnershipService(firstDataSource);
    secondOwnershipService = new RestoreExecutionOwnershipService(secondDataSource);
  });

  beforeEach(async () => {
    await firstDataSource.query('DELETE FROM restore_leases');
    await firstDataSource.query('DELETE FROM restore_jobs');
    await firstDataSource.query('DELETE FROM connections');
  });

  afterAll(async () => {
    try {
      if (firstDataSource.isInitialized) {
        const runner = firstDataSource.createQueryRunner();
        await runner.connect();
        try {
          await migration.down(runner);
          if (createdConnections) await runner.query('DROP TABLE connections');
          if (createdRestoreJobs) await runner.query('DROP TABLE restore_jobs');
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

  it('keeps target execution exclusive after an expired lease is taken over', async () => {
    const firstOwnership = await firstOwnershipService.tryAcquire(target);
    expect(firstOwnership).not.toBeNull();
    if (!firstOwnership) throw new Error('first ownership was not acquired');

    const firstJob = '00000000-0000-0000-0000-000000000111';
    const firstToken = '00000000-0000-0000-0000-000000000211';
    const secondJob = '00000000-0000-0000-0000-000000000112';
    const secondToken = '00000000-0000-0000-0000-000000000212';

    try {
      expect(await firstRepository.tryAcquire(target, firstJob, firstToken, new Date(Date.now() - 1_000))).toBe(true);
      expect(await secondRepository.tryAcquire(target, secondJob, secondToken, new Date(Date.now() + 60_000))).toBe(true);
      expect(await firstOwnershipService.hasActiveLease(firstOwnership, firstJob, firstToken)).toBe(false);
      expect(await secondOwnershipService.tryAcquire(target)).toBeNull();
    } finally {
      await firstOwnershipService.release(firstOwnership);
    }

    const secondOwnership = await secondOwnershipService.tryAcquire(target);
    expect(secondOwnership).not.toBeNull();
    if (!secondOwnership) throw new Error('second ownership was not acquired');
    await secondOwnershipService.release(secondOwnership);
  });

  it('admits exactly one concurrent restore job and target lease', async () => {
    const startedAt = new Date();
    const expiresAt = new Date(Date.now() + 60_000);
    await firstDataSource.query(
      `INSERT INTO connections (id, name, slug, environment, "dbType", host, port, database, username, password)
       VALUES ($1, 'Target', 'target-one', 'dev', 'postgres', 'localhost', 5432, 'target', 'user', $2)`,
      [target, encrypt('secret')],
    );
    const results = await Promise.all([
      firstRestoreRepository.tryCreateWithLease({
        id: '00000000-0000-0000-0000-000000000101',
        sourceBackupId: null,
        r2Key: 'source/manual/first.dump',
        targetConnectionId: target,
        targetEnvironment: Environment.DEV,
        triggeredBy: 'user-1',
        startedAt,
        leaseToken: '00000000-0000-0000-0000-000000000201',
        expiresAt,
      }),
      secondRestoreRepository.tryCreateWithLease({
        id: '00000000-0000-0000-0000-000000000102',
        sourceBackupId: null,
        r2Key: 'source/manual/second.dump',
        targetConnectionId: target,
        targetEnvironment: Environment.DEV,
        triggeredBy: 'user-2',
        startedAt,
        leaseToken: '00000000-0000-0000-0000-000000000202',
        expiresAt,
      }),
    ]);

    expect(results.filter((jobId) => jobId !== null)).toHaveLength(1);
    expect(await firstDataSource.query('SELECT id FROM restore_jobs')).toHaveLength(1);
    expect(await firstDataSource.query('SELECT "restoreJobId" FROM restore_leases')).toHaveLength(1);
  });

  it('serializes restore admission and target production mutation', async () => {
    await firstDataSource.query(
      `INSERT INTO connections (id, name, slug, environment, "dbType", host, port, database, username, password)
       VALUES ($1, 'Target', 'target-two', 'dev', 'postgres', 'localhost', 5432, 'target', 'user', $2)`,
      [targetTwo, encrypt('secret')],
    );
    const secondConnectionsService = new ConnectionsService(
      new ConnectionsRepository(
        secondDataSource.getRepository(ConnectionEntity),
        secondDataSource,
      ),
    );
    const [admission, mutation] = await Promise.allSettled([
      firstRestoreRepository.tryCreateWithLease({
        id: '00000000-0000-0000-0000-000000000103',
        sourceBackupId: null,
        r2Key: 'source/manual/race.dump',
        targetConnectionId: targetTwo,
        targetEnvironment: Environment.DEV,
        triggeredBy: 'user-3',
        startedAt: new Date(),
        leaseToken: '00000000-0000-0000-0000-000000000203',
        expiresAt: new Date(Date.now() + 60_000),
      }),
      secondConnectionsService.update(targetTwo, {
        environment: Environment.PROD,
      }),
    ]);
    const targetRow = await firstDataSource.query<{ environment: Environment }[]>(
      'SELECT environment FROM connections WHERE id = $1',
      [targetTwo],
    );

    if (admission.status === 'fulfilled' && admission.value !== null) {
      expect(mutation.status).toBe('rejected');
      if (mutation.status === 'rejected') {
        expect(mutation.reason).toBeInstanceOf(ForbiddenException);
      }
      expect(targetRow[0]?.environment).toBe(Environment.DEV);
      expect(await firstDataSource.query('SELECT id FROM restore_jobs')).toHaveLength(1);
      expect(await firstDataSource.query('SELECT "restoreJobId" FROM restore_leases')).toHaveLength(1);
      return;
    }

    expect(admission).toEqual({ status: 'fulfilled', value: null });
    expect(mutation.status).toBe('fulfilled');
    expect(targetRow[0]?.environment).toBe(Environment.PROD);
    expect(await firstDataSource.query('SELECT id FROM restore_jobs')).toHaveLength(0);
    expect(await firstDataSource.query('SELECT "restoreJobId" FROM restore_leases')).toHaveLength(0);
  });

  it('rejects a missing or inactive target during the live preflight session', async () => {
    const ownership = await firstOwnershipService.tryAcquire(target);
    expect(ownership).not.toBeNull();
    if (!ownership) throw new Error('ownership was not acquired');

    try {
      expect(await firstOwnershipService.findActiveTarget(ownership)).toBeNull();
    } finally {
      await firstOwnershipService.release(ownership);
    }
  });
});
