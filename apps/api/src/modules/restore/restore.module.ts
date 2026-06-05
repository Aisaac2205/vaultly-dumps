import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestoreJobEntity } from '../../database/entities/restore-job.entity';
import { ConnectionEntity } from '../../database/entities/connection.entity';
import { BackupJobEntity } from '../../database/entities/backup-job.entity';
import { ConnectionsModule } from '../connections/connections.module';
import { BackupModule } from '../backup/backup.module';
import { SseModule } from '../../shared/sse/sse.module';
import { RestoreController } from './restore.controller';
import { RestoreSseController } from './restore-sse.controller';
import { RestoreService } from './restore.service';
import { RestoreRepository } from './restore.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([RestoreJobEntity, ConnectionEntity, BackupJobEntity]),
    ConnectionsModule,
    BackupModule,
    SseModule,
  ],
  controllers: [RestoreController, RestoreSseController],
  providers: [RestoreService, RestoreRepository],
  exports: [RestoreService, RestoreRepository],
})
export class RestoreModule {}
