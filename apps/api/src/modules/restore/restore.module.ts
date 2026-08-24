import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestoreJobEntity } from '../../database/entities/restore-job.entity';
import { RestoreLeaseEntity } from '../../database/entities/restore-lease.entity';
import { ConnectionEntity } from '../../database/entities/connection.entity';
import { BackupJobEntity } from '../../database/entities/backup-job.entity';
import { ConnectionsModule } from '../connections/connections.module';
import { BackupModule } from '../backup/backup.module';
import { SseModule } from '../../shared/sse/sse.module';
import { RestoreController } from './restore.controller';
import { RestoreSseController } from './restore-sse.controller';
import { RestoreService } from './restore.service';
import { RestoreRepository } from './restore.repository';
import { RestoreLeaseRepository } from './restore-lease.repository';
import { RestoreExecutionOwnershipService } from './restore-execution-ownership.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RestoreJobEntity, RestoreLeaseEntity, ConnectionEntity, BackupJobEntity]),
    ConnectionsModule,
    BackupModule,
    SseModule,
  ],
  controllers: [RestoreController, RestoreSseController],
  providers: [RestoreService, RestoreRepository, RestoreLeaseRepository, RestoreExecutionOwnershipService],
  exports: [RestoreService, RestoreRepository, RestoreLeaseRepository],
})
export class RestoreModule {}
