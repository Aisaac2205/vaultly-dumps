import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BackupJobEntity } from '../../database/entities/backup-job.entity';
import { JobStatus } from '../../database/enums/job-status.enum';

@Injectable()
export class BackupRepository {
  constructor(
    @InjectRepository(BackupJobEntity)
    private readonly repository: Repository<BackupJobEntity>,
  ) {}

  findAll(): Promise<BackupJobEntity[]> {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  findById(id: string): Promise<BackupJobEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByConnection(connectionId: string): Promise<BackupJobEntity[]> {
    return this.repository.find({
      where: { connectionId },
      order: { createdAt: 'DESC' },
    });
  }

  create(data: Partial<BackupJobEntity>): Promise<BackupJobEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async updateStatus(
    id: string,
    status: JobStatus,
    updates?: Partial<BackupJobEntity>,
  ): Promise<void> {
    await this.repository.update(id, { status, ...updates });
  }

  /** Deletes job rows whose fileKey is in the given list. Returns rows removed. */
  async deleteByFileKeys(fileKeys: string[]): Promise<number> {
    if (fileKeys.length === 0) return 0;
    const result = await this.repository.delete({ fileKey: In(fileKeys) });
    return result.affected ?? 0;
  }
}
