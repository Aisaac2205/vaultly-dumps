import { Injectable, NotFoundException } from '@nestjs/common';
import { JobsRepository, JobFilters } from './jobs.repository';
import { JobStatus } from '../../database/enums/job-status.enum';

export interface JobSummary {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  running: number;
}

@Injectable()
export class JobsService {
  constructor(private readonly repository: JobsRepository) {}

  async getBackupJobs(filters?: JobFilters) {
    return this.repository.findAllBackupJobs(filters);
  }

  async getRestoreJobs(filters?: JobFilters) {
    return this.repository.findAllRestoreJobs(filters);
  }

  async getBackupJobById(id: string) {
    const job = await this.repository.findBackupJobById(id);
    if (!job) {
      throw new NotFoundException(`Backup job con ID "${id}" no encontrado`);
    }
    return job;
  }

  async getRestoreJobById(id: string) {
    const job = await this.repository.findRestoreJobById(id);
    if (!job) {
      throw new NotFoundException(`Restore job con ID "${id}" no encontrado`);
    }
    return job;
  }

  async getSummary(): Promise<JobSummary> {
    const backupCounts = await this.repository.countBackupJobsByStatus();

    const counts: Record<JobStatus, number> = {
      [JobStatus.PENDING]: 0,
      [JobStatus.RUNNING]: 0,
      [JobStatus.COMPLETED]: 0,
      [JobStatus.FAILED]: 0,
    };

    for (const row of backupCounts) {
      counts[row.status as JobStatus] = Number(row.count);
    }

    return {
      total: Object.values(counts).reduce((sum, n) => sum + n, 0),
      completed: counts[JobStatus.COMPLETED],
      failed: counts[JobStatus.FAILED],
      pending: counts[JobStatus.PENDING],
      running: counts[JobStatus.RUNNING],
    };
  }
}
