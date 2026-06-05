import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronjobEntity } from '../../database/entities/cronjob.entity';
import { BackupModule } from '../backup/backup.module';
import { ConnectionsModule } from '../connections/connections.module';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { CronjobsController } from './cronjobs.controller';
import { BackupSettingsController } from './backup-settings.controller';
import { CronjobsService } from './cronjobs.service';
import { CronjobsRepository } from './cronjobs.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([CronjobEntity]),
    BackupModule,
    ConnectionsModule,
    MaintenanceModule,
  ],
  controllers: [CronjobsController, BackupSettingsController],
  providers: [CronjobsService, CronjobsRepository],
})
export class CronjobsModule {}
