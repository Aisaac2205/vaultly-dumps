import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import databaseConfig from '../config/database.config';
import { AuditLogEntity } from './entities/audit-log.entity';
import { BackupJobEntity } from './entities/backup-job.entity';
import { ConnectionEntity } from './entities/connection.entity';
import { CronjobEntity } from './entities/cronjob.entity';
import { RestoreJobEntity } from './entities/restore-job.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(databaseConfig)],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions =>
        config.get<TypeOrmModuleOptions>('database')!,
    }),
    TypeOrmModule.forFeature([
      ConnectionEntity,
      BackupJobEntity,
      RestoreJobEntity,
      AuditLogEntity,
      CronjobEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
