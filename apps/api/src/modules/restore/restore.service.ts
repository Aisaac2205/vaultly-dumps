import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { createWriteStream, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { CreateRestoreDto } from './dto/create-restore.dto';
import { RestoreRepository } from './restore.repository';
import { R2Service } from '../backup/r2.service';
import { BackupService } from '../backup/backup.service';
import { ConnectionsService } from '../connections/connections.service';
import { KeycloakUser } from '../../common/decorators/current-user.decorator';
import { Environment } from '../../database/enums/environment.enum';
import { DbTypeEnum } from '../../database/enums/db-type.enum';
import { JobStatus } from '../../database/enums/job-status.enum';
import { BackupCategory } from '../../database/enums/backup-category.enum';
import { DryRunResult } from './interfaces/dry-run-result.interface';
import { ConnectionEntity } from '../../database/entities/connection.entity';
import { SseService } from '../../shared/sse/sse.service';
import { RestoreStrategy } from '../backup/interfaces/restore-strategy.interface';
import { Client } from 'pg';
import { createConnection as createMysqlConnection, RowDataPacket } from 'mysql2/promise';

const TRUNCATE_TIMEOUT_MS = 30_000;

@Injectable()
export class RestoreService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RestoreService.name);

  constructor(
    private readonly restoreRepository: RestoreRepository,
    private readonly r2Service: R2Service,
    private readonly backupService: BackupService,
    private readonly connectionsService: ConnectionsService,
    private readonly sseService: SseService,
    @Inject('RESTORE_STRATEGIES')
    private readonly restoreStrategies: Map<DbTypeEnum, RestoreStrategy>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const runningJobs = await this.restoreRepository.findByStatus(
      JobStatus.RUNNING,
    );

    if (runningJobs.length === 0) {
      return;
    }

    this.logger.warn(
      `Found ${runningJobs.length} running restore jobs on startup — marking as failed`,
    );

    for (const job of runningJobs) {
      await this.restoreRepository.updateStatus(job.id, JobStatus.FAILED, {
        errorMessage: 'Job interrupted — process restarted',
        completedAt: new Date(),
      });

      this.logger.warn(`Marked restore job ${job.id} as failed (interrupted)`);
    }
  }

  async createRestore(
    dto: CreateRestoreDto,
    user: KeycloakUser,
  ): Promise<{ jobId: string; dryRunResult?: DryRunResult }> {
    const targetConnection = await this.connectionsService.findById(
      dto.targetConnectionId,
    );

    const targetEnvironment = targetConnection.environment;

    if (targetEnvironment === Environment.PROD) {
      throw new ForbiddenException(
        `No se permiten restauraciones en producción. Conexión "${targetConnection.name}" es "prod".`,
      );
    }

    // Determine source: from R2 key or from existing backup job
    const isR2Restore = !!dto.r2Key;
    const fileKey = isR2Restore
      ? dto.r2Key!
      : (await this.backupService.getBackupById(dto.sourceBackupId!)).fileKey;

    if (!fileKey) {
      throw new NotFoundException(
        `El backup no tiene un archivo asociado`,
      );
    }

    // Reject arbitrary or cross-type R2 keys before any destructive operation.
    if (isR2Restore) {
      await this.assertR2KeyMatchesTarget(dto.r2Key!, targetConnection);
    }

    if (dto.isDryRun) {
      // Dry runs work the same regardless of source — analyze target DB
      const result = await this.dryRun(
        dto.sourceBackupId ?? dto.r2Key!,
        dto.targetConnectionId,
      );

      const dryJob = await this.restoreRepository.create({
        sourceBackupId: isR2Restore ? null : dto.sourceBackupId!,
        r2Key: isR2Restore ? dto.r2Key! : null,
        targetConnectionId: targetConnection.id,
        targetEnvironment,
        status: JobStatus.COMPLETED,
        isDryRun: true,
        triggeredBy: user.sub,
        startedAt: new Date(),
        completedAt: new Date(),
      });

      this.sseService.register(dryJob.id);
      this.sseService.emit(dryJob.id, {
        type: 'completed',
        payload: { jobId: dryJob.id, completedAt: new Date() },
      });
      this.sseService.complete(dryJob.id);

      return { jobId: dryJob.id, dryRunResult: result };
    }

    const job = await this.restoreRepository.create({
      sourceBackupId: isR2Restore ? null : dto.sourceBackupId!,
      r2Key: isR2Restore ? dto.r2Key! : null,
      targetConnectionId: targetConnection.id,
      targetEnvironment,
      status: JobStatus.PENDING,
      isDryRun: false,
      triggeredBy: user.sub,
      startedAt: new Date(),
    });

    this.sseService.register(job.id);

    setImmediate(() => {
      this.executeRestoreAsync(job.id, dto, user);
    });

    return { jobId: job.id };
  }

  private async executeRestoreAsync(
    jobId: string,
    dto: CreateRestoreDto,
    _user: KeycloakUser,
  ): Promise<void> {
    const startedAt = new Date();
    let tempFilePath: string | null = null;

    try {
      await this.restoreRepository.updateStatus(jobId, JobStatus.RUNNING, {
        startedAt,
      });

      this.sseService.emit(jobId, {
        type: 'progress',
        payload: { percent: 10 },
      });

      const targetConnection = await this.connectionsService.findById(
        dto.targetConnectionId,
      );

      const strategy = this.restoreStrategies.get(targetConnection.dbType);
      if (!strategy) {
        throw new Error(
          `No hay estrategia de restauración configurada para tipo "${targetConnection.dbType}"`,
        );
      }

      // Resolve fileKey: from R2 key or from existing backup job
      const fileKey = dto.r2Key
        ? dto.r2Key
        : (await this.backupService.getBackupById(dto.sourceBackupId!)).fileKey;

      if (!fileKey) {
        throw new Error(`El backup no tiene un archivo asociado`);
      }

      tempFilePath = join(
        tmpdir(),
        `restore-${Date.now()}-${jobId}.dump`,
      );

      const downloadStream = await this.r2Service.download(fileKey);
      const writeStream = createWriteStream(tempFilePath);
      await pipeline(downloadStream, writeStream);

      this.sseService.emit(jobId, {
        type: 'progress',
        payload: { percent: 25 },
      });

      await strategy.execute(targetConnection, tempFilePath, (message: string) => {
        this.sseService.emit(jobId, {
          type: 'log',
          payload: { message, timestamp: new Date() },
        });
      });

      this.sseService.emit(jobId, {
        type: 'progress',
        payload: { percent: 90 },
      });

      const completedAt = new Date();
      await this.restoreRepository.updateStatus(jobId, JobStatus.COMPLETED, {
        completedAt,
      });

      this.sseService.emit(jobId, {
        type: 'completed',
        payload: { jobId, completedAt },
      });
    } catch (error) {
      const completedAt = new Date();
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido en restore';

      this.logger.error(`Restore job ${jobId} failed: ${errorMessage}`);

      await this.restoreRepository.updateStatus(jobId, JobStatus.FAILED, {
        errorMessage,
        completedAt,
      }).catch((err: Error) => {
        this.logger.error(
          `Failed to update restore job ${jobId} status to FAILED: ${err.message}`,
        );
      });

      this.sseService.emit(jobId, {
        type: 'failed',
        payload: { jobId, error: errorMessage },
      });
    } finally {
      if (tempFilePath) {
        try {
          unlinkSync(tempFilePath);
        } catch {
          this.logger.warn(`Failed to delete temp file: ${tempFilePath}`);
        }
      }
      this.sseService.complete(jobId);
    }
  }

  async dryRun(
    _backupId: string,
    targetConnectionId: string,
  ): Promise<DryRunResult> {
    const targetConnection =
      await this.connectionsService.findById(targetConnectionId);

    if (targetConnection.dbType === DbTypeEnum.MYSQL) {
      return this.dryRunMySQL(targetConnection);
    }
    return this.dryRunPostgres(targetConnection);
  }

  private async dryRunPostgres(connection: ConnectionEntity): Promise<DryRunResult> {
    const client = new Client({
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.username,
      password: connection.password,
      connectionTimeoutMillis: TRUNCATE_TIMEOUT_MS,
    });

    try {
      await client.connect();
      const result = await client.query<{ name: string; estimated_rows: string }>(`
        SELECT relname AS name, COALESCE(n_live_tup, 0) AS estimated_rows
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY n_live_tup DESC
      `);
      return this.mapDryRunRows(result.rows);
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  private async dryRunMySQL(connection: ConnectionEntity): Promise<DryRunResult> {
    const conn = await createMysqlConnection({
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.username,
      password: connection.password,
      connectTimeout: TRUNCATE_TIMEOUT_MS,
    });

    try {
      const [rows] = await conn.query<(RowDataPacket & { name: string; estimated_rows: string })[]>(`
        SELECT TABLE_NAME AS name, COALESCE(TABLE_ROWS, 0) AS estimated_rows
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_ROWS DESC
      `);
      return this.mapDryRunRows(rows);
    } finally {
      await conn.end();
    }
  }

  private mapDryRunRows(
    rows: Array<{ name: string; estimated_rows: string }>,
  ): DryRunResult {
    const tables = rows.map((row) => ({
      name: row.name,
      estimatedRows: Number(row.estimated_rows),
    }));
    return {
      tableCount: tables.length,
      estimatedRows: tables.reduce((sum, t) => sum + t.estimatedRows, 0),
      tables,
    };
  }

  /**
   * Guarantees the requested r2Key is a well-formed dump path belonging to a
   * known source connection whose dbType matches the target. Without this
   * gate, an authenticated user could submit any string as `r2Key` and trigger
   * a destructive restore (TRUNCATE / --clean) against an unrelated target.
   */
  private async assertR2KeyMatchesTarget(
    r2Key: string,
    targetConnection: ConnectionEntity,
  ): Promise<void> {
    const segments = r2Key.split('/');
    const looksLikeDumpPath =
      segments.length === 3 &&
      segments[0].length > 0 &&
      segments[1].length > 0 &&
      segments[2].endsWith('.dump') &&
      !segments.some((s) => s === '..' || s === '.' || s.includes('\\'));

    if (!looksLikeDumpPath) {
      throw new ForbiddenException(
        `Clave R2 inválida. Se esperaba el formato "{slug}/{categoría}/{timestamp}.dump".`,
      );
    }

    const [sourceSlug, category] = segments;

    const validCategories = Object.values(BackupCategory) as string[];
    if (!validCategories.includes(category)) {
      throw new ForbiddenException(
        `Categoría de backup "${category}" no reconocida en la clave R2.`,
      );
    }

    let sourceConnection: ConnectionEntity;
    try {
      sourceConnection = await this.connectionsService.findBySlug(sourceSlug);
    } catch {
      throw new ForbiddenException(
        `El dump seleccionado no pertenece a ninguna conexión registrada.`,
      );
    }

    if (sourceConnection.dbType !== targetConnection.dbType) {
      throw new ForbiddenException(
        `Tipo de base de datos incompatible: el dump es "${sourceConnection.dbType}" ` +
          `pero el destino "${targetConnection.name}" es "${targetConnection.dbType}".`,
      );
    }
  }

  async listRestores() {
    return this.restoreRepository.findAll();
  }

  async getRestoreById(id: string) {
    const job = await this.restoreRepository.findById(id);
    if (!job) {
      throw new NotFoundException(
        `Restore job con ID "${id}" no encontrado`,
      );
    }
    return job;
  }
}
