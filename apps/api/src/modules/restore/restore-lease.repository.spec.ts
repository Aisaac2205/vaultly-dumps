import { readFileSync } from 'fs';
import { join } from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource, getMetadataArgsStorage } from 'typeorm';
import { RestoreLeaseEntity } from '../../database/entities/restore-lease.entity';
import { RestoreLeaseRepository } from './restore-lease.repository';

describe('RestoreLeaseRepository', () => {
  let repository: RestoreLeaseRepository;
  let dataSource: DataSource;
  let query: jest.SpiedFunction<DataSource['query']>;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: 'localhost',
      database: 'test',
    });
    query = jest.spyOn(dataSource, 'query');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestoreLeaseRepository,
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    repository = module.get<RestoreLeaseRepository>(RestoreLeaseRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('acquires an expired target lease atomically', async () => {
    const expiresAt = new Date('2026-08-21T15:10:00.000Z');
    query.mockResolvedValue([{ targetConnectionId: 'target-1' }]);

    const acquired = await repository.tryAcquire(
      'target-1',
      'job-1',
      'token-1',
      expiresAt,
    );

    expect(acquired).toBe(true);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT ("targetConnectionId") DO UPDATE'),
      ['target-1', 'job-1', 'token-1', expiresAt],
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE restore_leases."expiresAt" <= CURRENT_TIMESTAMP'),
      ['target-1', 'job-1', 'token-1', expiresAt],
    );
  });

  it('does not acquire an unexpired target lease', async () => {
    query.mockResolvedValue([]);

    const acquired = await repository.tryAcquire(
      'target-1',
      'job-2',
      'token-2',
      new Date('2026-08-21T15:10:00.000Z'),
    );

    expect(acquired).toBe(false);
  });

  it('renews only the active lease held by the matching job and token', async () => {
    const expiresAt = new Date('2026-08-21T15:20:00.000Z');
    query.mockResolvedValue([{ targetConnectionId: 'target-1' }]);

    const renewed = await repository.renew(
      'target-1',
      'job-1',
      'token-1',
      expiresAt,
    );

    expect(renewed).toBe(true);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('AND "leaseToken" = $3'),
      ['target-1', 'job-1', 'token-1', expiresAt],
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('AND "expiresAt" > CURRENT_TIMESTAMP'),
      ['target-1', 'job-1', 'token-1', expiresAt],
    );
  });

  it('does not release a lease owned by a different token', async () => {
    query.mockResolvedValue([]);

    const released = await repository.release('target-1', 'job-1', 'token-2');

    expect(released).toBe(false);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('AND "leaseToken" = $3'),
      ['target-1', 'job-1', 'token-2'],
    );

  });
  it('uses PostgreSQL affected rows for a rejected renewal', async () => {
    query.mockResolvedValue([[], 0]);

    const renewed = await repository.renew(
      'target-1',
      'job-1',
      'token-1',
      new Date('2026-08-21T15:20:00.000Z'),
    );

    expect(renewed).toBe(false);
  });

  it('uses PostgreSQL affected rows for release ownership', async () => {
    query.mockResolvedValue([[{ targetConnectionId: 'target-1' }], 1]);

    const released = await repository.release('target-1', 'job-1', 'token-1');

    expect(released).toBe(true);
  });
});
describe('restore lease expiry persistence', () => {
  it('maps expiry to an absolute PostgreSQL instant', () => {
    const column = getMetadataArgsStorage().columns.find(
      (candidate) =>
        candidate.target === RestoreLeaseEntity &&
        candidate.propertyName === 'expiresAt',
    );

    expect(column?.options.type).toBe('timestamptz');
  });

  it('migrates expiry as an absolute PostgreSQL instant', () => {
    const migration = readFileSync(
      join(
        __dirname,
        '../../database/migrations/1778716800018-create-restore-leases.ts',
      ),
      'utf8',
    );

    expect(migration).toContain("{ name: 'expiresAt', type: 'timestamptz' }");
    expect(migration).toContain("await queryRunner.query('DROP TABLE \"restore_leases\"');");
  });
});
