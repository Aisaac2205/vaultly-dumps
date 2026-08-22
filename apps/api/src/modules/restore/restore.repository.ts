import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RestoreJobEntity } from '../../database/entities/restore-job.entity';
import { Environment } from '../../database/enums/environment.enum';
import { JobStatus } from '../../database/enums/job-status.enum';

interface RestoreQueueAdmission {
  id: string;
  sourceBackupId: string | null;
  r2Key: string | null;
  targetConnectionId: string;
  targetEnvironment: Environment;
  triggeredBy: string;
  startedAt: Date;
  leaseToken: string;
  expiresAt: Date;
}

@Injectable()
export class RestoreRepository {
  constructor(
    @InjectRepository(RestoreJobEntity)
    private readonly repository: Repository<RestoreJobEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<RestoreJobEntity[]> {
    return this.repository.find({
      where: { isDryRun: false },
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string): Promise<RestoreJobEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByTarget(targetConnectionId: string): Promise<RestoreJobEntity[]> {
    return this.repository.find({
      where: { targetConnectionId },
      order: { createdAt: 'DESC' },
    });
  }

  findByStatus(status: JobStatus): Promise<RestoreJobEntity[]> {
    return this.repository.find({ where: { status } });
  }

  create(data: Partial<RestoreJobEntity>): Promise<RestoreJobEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async tryCreateWithLease(data: RestoreQueueAdmission): Promise<string | null> {
    const rows = await this.dataSource.query<{ id: string }[]>(
      `WITH locked_target AS (
         SELECT id
         FROM connections
         WHERE id = $4
           AND "isActive" = TRUE
           AND environment <> $11
         FOR UPDATE
       ), lease AS (
         INSERT INTO restore_leases ("targetConnectionId", "restoreJobId", "leaseToken", "expiresAt")
         SELECT id, $1, $8, $9
         FROM locked_target
         ON CONFLICT ("targetConnectionId") DO UPDATE
         SET "restoreJobId" = EXCLUDED."restoreJobId",
             "leaseToken" = EXCLUDED."leaseToken",
             "expiresAt" = EXCLUDED."expiresAt"
         WHERE restore_leases."expiresAt" <= CURRENT_TIMESTAMP
         RETURNING "restoreJobId"
       )
       INSERT INTO restore_jobs (id, "sourceBackupId", "r2Key", "targetConnectionId", "targetEnvironment", status, "isDryRun", "startedAt", "triggeredBy")
       SELECT $1, $2, $3, $4, $5, $6, FALSE, $7, $10
       FROM lease
       RETURNING id`,
      [
        data.id,
        data.sourceBackupId,
        data.r2Key,
        data.targetConnectionId,
        data.targetEnvironment,
        JobStatus.PENDING,
        data.startedAt,
        data.leaseToken,
        data.expiresAt,
        data.triggeredBy,
        Environment.PROD,
      ],
    );

    return rows[0]?.id ?? null;
  }

  updateStatus(
    id: string,
    status: JobStatus,
    updates?: Partial<RestoreJobEntity>,
  ): Promise<RestoreJobEntity> {
    return this.repository.save({ id, status, ...updates });
  }
}
