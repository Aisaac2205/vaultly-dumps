import { Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { BackupService } from '../backup/backup.service';
import { BackupRepository } from '../backup/backup.repository';
import { R2Service } from '../backup/r2.service';
import { ConnectionsService } from '../connections/connections.service';
import { CronjobsRepository } from '../cronjobs/cronjobs.repository';
import { CronjobsService } from '../cronjobs/cronjobs.service';
import { ConnectionRetentionPolicyEntity } from '../../database/entities/connection-retention-policy.entity';
import { ManualRetentionSettingEntity } from '../../database/entities/manual-retention-setting.entity';
import { CronFrequency } from '../../database/enums/cron-frequency.enum';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { RestoreRepository } from '../restore/restore.repository';

type LockHarness = {
  name: string;
  lockId: number;
  connect: jest.SpiedFunction<QueryRunner['connect']>;
  release: jest.SpiedFunction<QueryRunner['release']>;
  query: jest.SpiedFunction<DataSource['query']>;
  queryRunner: QueryRunner;
  run(): Promise<void>;
  prepareSuccess(): void;
  prepareWorkFailure(): void;
  assertSkipped(): void;
  workFailure: string;
};

function createDataSource(): {
  dataSource: DataSource;
  queryRunner: QueryRunner;
  connect: jest.SpiedFunction<QueryRunner['connect']>;
  release: jest.SpiedFunction<QueryRunner['release']>;
  query: jest.SpiedFunction<DataSource['query']>;
} {
  const dataSource = new DataSource({ type: 'postgres', host: 'localhost', database: 'test' });
  const queryRunner = dataSource.createQueryRunner();
  jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(queryRunner);
  const connect = jest.spyOn(queryRunner, 'connect').mockResolvedValue(undefined);
  const release = jest.spyOn(queryRunner, 'release').mockResolvedValue();
  return { dataSource, queryRunner, connect, release, query: jest.spyOn(dataSource, 'query') };
}

async function createCronHarness(): Promise<LockHarness> {
  const { dataSource, queryRunner, connect, release, query } = createDataSource();
  const repository = { findById: jest.fn(), updateRunMetadata: jest.fn() };
  const backupService = { createBackup: jest.fn() };
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CronjobsService,
      { provide: CronjobsRepository, useValue: repository },
      { provide: SchedulerRegistry, useValue: {} },
      { provide: BackupService, useValue: backupService },
      { provide: MaintenanceService, useValue: {} },
      { provide: ConnectionsService, useValue: {} },
      { provide: getDataSourceToken(), useValue: dataSource },
    ],
  }).compile();
  const service = module.get(CronjobsService);
  return {
    name: 'CronjobsService', lockId: -6603463, connect, release, query, queryRunner,
    run: () => Reflect.apply(Reflect.get(service, 'executeCronjob'), service, ['cronjob-id']),
    prepareSuccess: () => {
      repository.findById.mockResolvedValue({ id: 'cronjob-id', name: 'daily', isActive: true, connectionId: 'connection-id', frequency: CronFrequency.DAILY });
      repository.updateRunMetadata.mockResolvedValue(undefined);
      backupService.createBackup.mockResolvedValue(undefined);
    },
    prepareWorkFailure: () => repository.findById.mockRejectedValue(new Error('repository unavailable')),
    assertSkipped: () => expect(repository.findById).not.toHaveBeenCalled(),
    workFailure: 'repository unavailable',
  };
}

async function createMaintenanceHarness(): Promise<LockHarness> {
  const { dataSource, queryRunner, connect, release, query } = createDataSource();
  const connections = { findAll: jest.fn() };
  const policies = { find: jest.fn() };
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      MaintenanceService,
      { provide: BackupService, useValue: {} }, { provide: BackupRepository, useValue: {} },
      { provide: R2Service, useValue: {} }, { provide: RestoreRepository, useValue: {} },
      { provide: ConnectionsService, useValue: connections },
      { provide: getRepositoryToken(ManualRetentionSettingEntity), useValue: {} },
      { provide: getRepositoryToken(ConnectionRetentionPolicyEntity), useValue: policies },
      { provide: getDataSourceToken(), useValue: dataSource },
    ],
  }).compile();
  const service = module.get(MaintenanceService);
  return {
    name: 'MaintenanceService', lockId: 778716811, connect, release, query, queryRunner,
    run: () => service.sweepManualRetention(),
    prepareSuccess: () => { connections.findAll.mockResolvedValue([]); policies.find.mockResolvedValue([]); },
    prepareWorkFailure: () => connections.findAll.mockRejectedValue(new Error('connection lookup failed')),
    assertSkipped: () => { expect(connections.findAll).not.toHaveBeenCalled(); expect(policies.find).not.toHaveBeenCalled(); },
    workFailure: 'connection lookup failed',
  };
}

describe.each([{ create: createCronHarness }, { create: createMaintenanceHarness }])('scheduler lock lifecycle', ({ create }) => {
  let harness: LockHarness;

  beforeEach(async () => { harness = await create(); });
  afterEach(() => { jest.restoreAllMocks(); });

  it('uses one connected runner for acquisition and release on the normal path', async () => {
    harness.prepareSuccess();
    harness.query.mockResolvedValueOnce([{ acquired: true }]).mockResolvedValueOnce([{ released: true }]);
    await harness.run();
    expect(harness.connect.mock.invocationCallOrder[0]).toBeLessThan(harness.query.mock.invocationCallOrder[0]);
    expect(harness.query).toHaveBeenNthCalledWith(1, 'SELECT pg_try_advisory_lock($1) AS acquired', [harness.lockId], harness.queryRunner);
    expect(harness.query).toHaveBeenNthCalledWith(2, 'SELECT pg_advisory_unlock($1) AS released', [harness.lockId], harness.queryRunner);
    expect(harness.release.mock.invocationCallOrder[0]).toBeGreaterThan(harness.query.mock.invocationCallOrder[1]);
  });

  it('skips contested work and releases the runner', async () => {
    harness.query.mockResolvedValue([{ acquired: false }]);
    await harness.run();
    harness.assertSkipped();
    expect(harness.query).toHaveBeenCalledTimes(1);
    expect(harness.release.mock.invocationCallOrder[0]).toBeGreaterThan(harness.query.mock.invocationCallOrder[0]);
  });

  it('preserves a work failure when unlock also throws', async () => {
    harness.prepareWorkFailure();
    const loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    harness.query.mockResolvedValueOnce([{ acquired: true }]).mockRejectedValueOnce(new Error('unlock failed'));
    await harness.run();
    expect(loggerError).toHaveBeenCalledWith(expect.stringContaining(harness.workFailure));
    expect(loggerError).toHaveBeenCalledWith(expect.stringContaining('unlock failed'));
    expect(harness.release.mock.invocationCallOrder[0]).toBeGreaterThan(harness.query.mock.invocationCallOrder[1]);
  });

  it('logs false and thrown unlock failures while releasing the runner', async () => {
    harness.query.mockResolvedValueOnce([{ acquired: true }]).mockResolvedValueOnce([{ released: false }]);
    const loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    await harness.run();
    expect(loggerError).toHaveBeenCalledWith(expect.stringContaining('advisory lock'));
    expect(harness.release.mock.invocationCallOrder[0]).toBeGreaterThan(harness.query.mock.invocationCallOrder[1]);
    jest.restoreAllMocks();
    harness = await create();
    harness.prepareSuccess();
    const unlockError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    harness.query.mockResolvedValueOnce([{ acquired: true }]).mockRejectedValueOnce(new Error('unlock failed'));
    await harness.run();
    expect(unlockError).toHaveBeenCalledWith(expect.stringContaining('unlock failed'));
    expect(harness.release.mock.invocationCallOrder[0]).toBeGreaterThan(harness.query.mock.invocationCallOrder[1]);
  });
});
