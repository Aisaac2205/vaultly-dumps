import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { BackupJobEntity } from '../../database/entities/backup-job.entity';
import { RestoreJobEntity } from '../../database/entities/restore-job.entity';
import { ConnectionEntity } from '../../database/entities/connection.entity';
import { JobStatus } from '../../database/enums/job-status.enum';
import { Environment } from '../../database/enums/environment.enum';

export interface JobFilters {
  status?: JobStatus;
  environment?: Environment;
  from?: Date;
  to?: Date;
}

@Injectable()
export class JobsRepository {
  constructor(
    @InjectRepository(BackupJobEntity)
    private readonly backupJobRepository: Repository<BackupJobEntity>,
    @InjectRepository(RestoreJobEntity)
    private readonly restoreJobRepository: Repository<RestoreJobEntity>,
    @InjectRepository(ConnectionEntity)
    private readonly connectionRepository: Repository<ConnectionEntity>,
  ) {}

  async findAllBackupJobs(filters?: JobFilters): Promise<(BackupJobEntity & { connectionName: string | null })[]> {
    const where = this.buildBackupWhere(filters);
    const jobs = await this.backupJobRepository.find({ where, order: { createdAt: 'DESC' } });

    if (jobs.length === 0) return [];

    const ids = [...new Set(jobs.map((j) => j.connectionId))];
    const connections = await this.connectionRepository.findBy({ id: In(ids) });
    const nameMap = new Map(connections.map((c) => [c.id, c.name]));

    return jobs.map((j) => Object.assign(j, { connectionName: nameMap.get(j.connectionId) ?? null }));
  }

  findAllRestoreJobs(filters?: JobFilters): Promise<RestoreJobEntity[]> {
    const where = this.buildRestoreWhere(filters);
    return this.restoreJobRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  findBackupJobById(id: string): Promise<BackupJobEntity | null> {
    return this.backupJobRepository.findOne({ where: { id } });
  }

  findRestoreJobById(id: string): Promise<RestoreJobEntity | null> {
    return this.restoreJobRepository.findOne({ where: { id } });
  }

  countBackupJobsByStatus(): Promise<{ status: JobStatus; count: string }[]> {
    return this.backupJobRepository
      .createQueryBuilder('backup_job')
      .select('backup_job.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('backup_job.status')
      .getRawMany();
  }

  countRestoreJobsByStatus(): Promise<{ status: JobStatus; count: string }[]> {
    return this.restoreJobRepository
      .createQueryBuilder('restore_job')
      .select('restore_job.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('restore_job.status')
      .getRawMany();
  }

  private buildBackupWhere(filters?: JobFilters): Record<string, unknown> {
    if (!filters) return {};

    const where: Record<string, unknown> = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.environment) {
      where.environment = filters.environment;
    }

    if (filters.from && filters.to) {
      where.createdAt = Between(filters.from, filters.to);
    } else if (filters.from) {
      where.createdAt = Between(filters.from, new Date());
    } else if (filters.to) {
      where.createdAt = Between(new Date(0), filters.to);
    }

    return where;
  }

  private buildRestoreWhere(filters?: JobFilters): Record<string, unknown> {
    if (!filters) return {};

    const where: Record<string, unknown> = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.environment) {
      where.targetEnvironment = filters.environment;
    }

    if (filters.from && filters.to) {
      where.createdAt = Between(filters.from, filters.to);
    } else if (filters.from) {
      where.createdAt = Between(filters.from, new Date());
    } else if (filters.to) {
      where.createdAt = Between(new Date(0), filters.to);
    }

    return where;
  }
}
