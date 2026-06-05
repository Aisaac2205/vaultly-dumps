import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManualRetentionSettingEntity } from '../../database/entities/manual-retention-setting.entity';
import { BackupModule } from '../backup/backup.module';
import { RestoreModule } from '../restore/restore.module';
import { ConnectionsModule } from '../connections/connections.module';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ManualRetentionSettingEntity]),
    BackupModule,
    RestoreModule,
    ConnectionsModule,
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
