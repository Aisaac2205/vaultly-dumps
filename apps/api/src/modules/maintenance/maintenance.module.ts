import { Module } from '@nestjs/common';
import { BackupModule } from '../backup/backup.module';
import { RestoreModule } from '../restore/restore.module';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';

@Module({
  imports: [BackupModule, RestoreModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
