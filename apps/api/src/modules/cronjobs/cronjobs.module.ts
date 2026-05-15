import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronjobEntity } from '../../database/entities/cronjob.entity';
import { BackupModule } from '../backup/backup.module';
import { CronjobsController } from './cronjobs.controller';
import { BackupSettingsController } from './backup-settings.controller';
import { CronjobsService } from './cronjobs.service';
import { CronjobsRepository } from './cronjobs.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([CronjobEntity]),
    BackupModule,
  ],
  controllers: [CronjobsController, BackupSettingsController],
  providers: [CronjobsService, CronjobsRepository],
})
export class CronjobsModule {}
