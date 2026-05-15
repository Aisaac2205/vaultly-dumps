import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupJobEntity } from '../../database/entities/backup-job.entity';
import { RestoreJobEntity } from '../../database/entities/restore-job.entity';
import { ConnectionEntity } from '../../database/entities/connection.entity';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobsRepository } from './jobs.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BackupJobEntity, RestoreJobEntity, ConnectionEntity])],
  controllers: [JobsController],
  providers: [JobsService, JobsRepository],
})
export class JobsModule {}
