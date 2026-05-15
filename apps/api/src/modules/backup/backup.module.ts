import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupJobEntity } from '../../database/entities/backup-job.entity';
import { ConnectionEntity } from '../../database/entities/connection.entity';
import { ConnectionsModule } from '../connections/connections.module';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { BackupRepository } from './backup.repository';
import { R2Service } from './r2.service';
import { PostgresBackupStrategy } from './strategies/postgres-backup.strategy';
import { MySQLBackupStrategy } from './strategies/mysql-backup.strategy';
import { PostgresRestoreStrategy } from './strategies/postgres-restore.strategy';
import { MySQLRestoreStrategy } from './strategies/mysql-restore.strategy';
import { DbTypeEnum } from '../../database/enums/db-type.enum';
import { BackupStrategy } from './interfaces/backup-strategy.interface';
import { RestoreStrategy } from './interfaces/restore-strategy.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([BackupJobEntity, ConnectionEntity]),
    ConnectionsModule,
  ],
  controllers: [BackupController],
  providers: [
    BackupService,
    BackupRepository,
    R2Service,
    PostgresBackupStrategy,
    MySQLBackupStrategy,
    PostgresRestoreStrategy,
    MySQLRestoreStrategy,
    {
      provide: 'BACKUP_STRATEGIES',
      useFactory: (
        postgres: PostgresBackupStrategy,
        mysql: MySQLBackupStrategy,
      ) => {
        const map = new Map<DbTypeEnum, BackupStrategy>();
        map.set(DbTypeEnum.POSTGRES, postgres);
        map.set(DbTypeEnum.MYSQL, mysql);
        return map;
      },
      inject: [PostgresBackupStrategy, MySQLBackupStrategy],
    },
    {
      provide: 'RESTORE_STRATEGIES',
      useFactory: (
        postgres: PostgresRestoreStrategy,
        mysql: MySQLRestoreStrategy,
      ) => {
        const map = new Map<DbTypeEnum, RestoreStrategy>();
        map.set(DbTypeEnum.POSTGRES, postgres);
        map.set(DbTypeEnum.MYSQL, mysql);
        return map;
      },
      inject: [PostgresRestoreStrategy, MySQLRestoreStrategy],
    },
  ],
  exports: [
    BackupService,
    R2Service,
    'BACKUP_STRATEGIES',
    'RESTORE_STRATEGIES',
  ],
})
export class BackupModule {}
