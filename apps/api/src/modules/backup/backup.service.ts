import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateBackupDto } from './dto/create-backup.dto';
import { BackupRepository } from './backup.repository';
import { R2Service } from './r2.service';
import { BackupResult } from './interfaces/backup-result.interface';
import { BackupHistoryItem } from './interfaces/backup-history-item.interface';
import { R2Object } from './interfaces/r2-object.interface';
import { EnrichedR2Object } from './interfaces/enriched-r2-object.interface';
import { BackupStrategy } from './interfaces/backup-strategy.interface';
import { ConnectionsService } from '../connections/connections.service';
import { KeycloakUser } from '../../common/decorators/current-user.decorator';
import { Environment } from '../../database/enums/environment.enum';
import { DbTypeEnum } from '../../database/enums/db-type.enum';
import { JobStatus } from '../../database/enums/job-status.enum';
import { BackupCategory } from '../../database/enums/backup-category.enum';
import {
  BackupJobEntity,
  STORAGE_KEY_VERSION,
} from '../../database/entities/backup-job.entity';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private readonly backupRepository: BackupRepository,
    private readonly r2Service: R2Service,
    private readonly connectionsService: ConnectionsService,
    @Inject('BACKUP_STRATEGIES')
    private readonly backupStrategies: Map<DbTypeEnum, BackupStrategy>,
  ) {}

  async createBackup(
    dto: CreateBackupDto,
    user: KeycloakUser,
    category: BackupCategory = BackupCategory.MANUAL,
  ): Promise<BackupResult> {
    const connection = await this.connectionsService.findById(dto.connectionId);

    if (connection.environment !== Environment.PROD) {
      throw new BadRequestException(
        `Solo se permiten backups del entorno de producción. Conexión "${connection.name}" es "${connection.environment}".`,
      );
    }

    const strategy = this.backupStrategies.get(connection.dbType);
    if (!strategy) {
      throw new BadRequestException(
        `No hay estrategia de backup configurada para tipo "${connection.dbType}"`,
      );
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileKey = `${connection.slug}/${category}/${timestamp}.dump`;

    const metadata: Record<string, string> = {
      connectionId: connection.id,
      connectionSlug: connection.slug,
      category,
      environment: connection.environment,
      dbType: connection.dbType,
      triggeredBy: user.sub,
    };

    const job = await this.backupRepository.create({
      connectionId: connection.id,
      environment: connection.environment,
      dbType: connection.dbType,
      status: JobStatus.PENDING,
      triggeredBy: user.sub,
      category,
      storageKeyVersion: STORAGE_KEY_VERSION.NEW,
    });

    const startedAt = new Date();

    await this.backupRepository.updateStatus(job.id, JobStatus.RUNNING, {
      fileKey,
      startedAt,
    });

    try {
      const fileSizeMb = await strategy.execute(connection, fileKey, metadata);
      const completedAt = new Date();

      await this.backupRepository.updateStatus(job.id, JobStatus.COMPLETED, {
        fileSizeMb,
        completedAt,
      });

      return {
        jobId: job.id,
        fileKey,
        fileSizeMb,
        startedAt,
        completedAt,
      };
    } catch (error) {
      const completedAt = new Date();
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido en backup';

      await this.backupRepository.updateStatus(job.id, JobStatus.FAILED, {
        errorMessage,
        completedAt,
      });

      return {
        jobId: job.id,
        fileKey,
        fileSizeMb: 0,
        startedAt,
        completedAt,
      };
    }
  }

  async listBackups(): Promise<BackupJobEntity[]> {
    return this.backupRepository.findAll();
  }

  async getHistory(): Promise<BackupHistoryItem[]> {
    const jobs = await this.backupRepository.findAll();
    if (jobs.length === 0) return [];

    const ids = [...new Set(jobs.map((j) => j.connectionId))];
    const nameMap = await this.connectionsService.findByIds(ids);

    return jobs.map((job) => ({
      ...job,
      connectionName: nameMap.get(job.connectionId) ?? '(eliminada)',
    }));
  }

  async triggerManual(connectionId: string, user: KeycloakUser): Promise<BackupResult> {
    return this.createBackup({ connectionId }, user, BackupCategory.MANUAL);
  }

  async listEnrichedDumps(
    connectionSlug: string,
    category: BackupCategory,
  ): Promise<EnrichedR2Object[]> {
    const connection = await this.connectionsService.findBySlug(connectionSlug);

    const prefix = `${connection.slug}/${category}/`;
    const objects = await this.r2Service.list(prefix);

    return objects.map((obj) => {
      const filename = obj.key.split('/').pop() ?? '';
      const timestamp = filename.replace(/\.dump$/, '');

      return {
        key: obj.key,
        size: obj.size,
        lastModified: obj.lastModified,
        etag: obj.etag,
        connectionId: connection.id,
        connectionSlug: connection.slug,
        connectionName: connection.name,
        dbType: connection.dbType,
        category,
        timestamp,
      };
    });
  }

  async listDumpsFromR2(): Promise<R2Object[]> {
    return this.r2Service.list();
  }

  async getBackupById(
    id: string,
  ): Promise<BackupHistoryItem> {
    const job = await this.backupRepository.findById(id);
    if (!job) {
      throw new NotFoundException(`Backup job con ID "${id}" no encontrado`);
    }

    let connectionName = '(eliminada)';
    try {
      const connection = await this.connectionsService.findById(job.connectionId);
      connectionName = connection.name;
    } catch {
      // Connection may have been deleted — keep default name
    }

    return {
      ...job,
      connectionName,
    };
  }
}
