import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { BackupService } from '../backup/backup.service';
import { R2Service } from '../backup/r2.service';
import { RestoreStrategy } from '../backup/interfaces/restore-strategy.interface';
import { ConnectionsService } from '../connections/connections.service';
import { Environment } from '../../database/enums/environment.enum';
import { DbTypeEnum } from '../../database/enums/db-type.enum';
import { JobStatus } from '../../database/enums/job-status.enum';
import { SseService } from '../../shared/sse/sse.service';
import { RestoreExecutionOwnershipService } from './restore-execution-ownership.service';
import { RestoreLeaseRepository } from './restore-lease.repository';
import { RestoreRepository } from './restore.repository';
import { RestoreService } from './restore.service';
import { RestoreStagingService } from './restore-staging.service';

type FinalizerStep = 'staging' | 'ownership' | 'sse' | 'lease';

describe('RestoreService finalizer', () => {
  const targetConnectionId = '00000000-0000-0000-0000-000000000001';
  const jobId = '00000000-0000-0000-0000-000000000002';
  const leaseToken = '00000000-0000-0000-0000-000000000003';

  async function createService(failingStep: FinalizerStep) {
    const calls: string[] = [];
    const restoreRepository = {
      failPendingIfLeaseInactive: jest.fn().mockResolvedValue(undefined),
      startIfLeaseActive: jest.fn().mockResolvedValue(true),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };
    const target = { dbType: DbTypeEnum.POSTGRES, environment: Environment.DEV };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestoreService,
        { provide: RestoreRepository, useValue: restoreRepository },
        {
          provide: RestoreLeaseRepository,
          useValue: {
            release: async () => {
              calls.push('lease');
              if (failingStep === 'lease') throw new Error('lease release failed');
            },
          },
        },
        {
          provide: RestoreExecutionOwnershipService,
          useValue: {
            findActiveTarget: async () => target,
            hasActiveLease: async () => true,
            release: async () => {
              calls.push('ownership');
              if (failingStep === 'ownership') throw new Error('ownership release failed');
            },
            tryAcquire: async () => ({ targetConnectionId }),
          },
        },
        {
          provide: RestoreStagingService,
          useValue: {
            cleanup: async () => {
              calls.push('staging');
              if (failingStep === 'staging') throw new Error('staging cleanup failed');
            },
            create: async () => ({ directoryPath: 'staging', dumpFileHandle: null, dumpFilePath: 'staging/dump', metadataPath: 'staging/metadata' }),
            writeDump: async () => undefined,
          },
        },
        { provide: R2Service, useValue: { download: async () => Readable.from('dump') } },
        {
          provide: BackupService,
          useValue: {
            getBackupById: async () => ({ dbType: DbTypeEnum.POSTGRES, fileKey: 'source/manual/dump.dump', status: JobStatus.COMPLETED }),
          },
        },
        { provide: ConnectionsService, useValue: { findById: async () => target } },
        {
          provide: SseService,
          useValue: {
            complete: () => {
              calls.push('sse');
              if (failingStep === 'sse') throw new Error('sse completion failed');
            },
            emit: () => undefined,
          },
        },
        {
          provide: 'RESTORE_STRATEGIES',
          useValue: new Map<DbTypeEnum, RestoreStrategy>([
            [DbTypeEnum.POSTGRES, { execute: async () => undefined }],
          ]),
        },
      ],
    }).compile();

    return { calls, restoreRepository, service: module.get(RestoreService) };
  }

  const finalizerSteps: FinalizerStep[] = ['staging', 'ownership', 'sse', 'lease'];

  for (const failingStep of finalizerSteps) {
    it(`releases the token-matched lease after a ${failingStep} finalizer failure`, async () => {
      const { calls, restoreRepository, service } = await createService(failingStep);

      await expect(service.executeRestoreAsync(
        jobId,
        { isDryRun: false, sourceBackupId: 'backup-1', targetConnectionId },
        { email: 'admin@example.test', id: 'admin', name: 'Admin', role: 'admin' },
        leaseToken,
      )).resolves.toBeUndefined();

      expect(calls).toEqual(['staging', 'ownership', 'sse', 'lease']);
      expect(restoreRepository.updateStatus).toHaveBeenCalledWith(
        jobId,
        JobStatus.COMPLETED,
        expect.objectContaining({ completedAt: expect.any(Date) }),
      );
    });
  }
});
