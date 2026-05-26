import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestoreJobEntity } from '../../database/entities/restore-job.entity';
import { JobStatus } from '../../database/enums/job-status.enum';

@Injectable()
export class RestoreRepository {
  constructor(
    @InjectRepository(RestoreJobEntity)
    private readonly repository: Repository<RestoreJobEntity>,
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

  updateStatus(
    id: string,
    status: JobStatus,
    updates?: Partial<RestoreJobEntity>,
  ): Promise<RestoreJobEntity> {
    return this.repository.save({ id, status, ...updates });
  }
}
