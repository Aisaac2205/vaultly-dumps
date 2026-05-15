import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { CronjobsRepository } from './cronjobs.repository';
import { BackupService } from '../backup/backup.service';
import { CreateCronjobDto } from './dto/create-cronjob.dto';
import { UpdateCronjobDto } from './dto/update-cronjob.dto';
import { CronjobEntity } from '../../database/entities/cronjob.entity';
import { KeycloakUser } from '../../common/decorators/current-user.decorator';
import { JobStatus } from '../../database/enums/job-status.enum';
import { CronFrequency } from '../../database/enums/cron-frequency.enum';
import { BackupCategory } from '../../database/enums/backup-category.enum';

const FREQUENCY_TO_CATEGORY: Record<CronFrequency, BackupCategory> = {
  [CronFrequency.HOURLY]: BackupCategory.HOURLY,
  [CronFrequency.DAILY]: BackupCategory.DAILY,
  [CronFrequency.WEEKLY]: BackupCategory.WEEKLY,
  [CronFrequency.CUSTOM]: BackupCategory.CUSTOM,
};

// Período esperado entre ticks por frecuencia. Usado por el catch-up al boot
// para detectar cuándo se perdió al menos un tick. CUSTOM se omite porque
// la expresión es arbitraria — sin parser de cron no se puede inferir.
const FREQUENCY_TO_PERIOD_MS: Partial<Record<CronFrequency, number>> = {
  [CronFrequency.HOURLY]: 60 * 60 * 1000,
  [CronFrequency.DAILY]: 24 * 60 * 60 * 1000,
  [CronFrequency.WEEKLY]: 7 * 24 * 60 * 60 * 1000,
};

const SYSTEM_USER: KeycloakUser = {
  sub: 'system-cronjob',
  preferred_username: 'system',
  realm_access: { roles: [] },
};

@Injectable()
export class CronjobsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CronjobsService.name);

  constructor(
    private readonly repository: CronjobsRepository,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly backupService: BackupService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const active = await this.repository.findAllActive();
      for (const cronjob of active) {
        this.registerCronJob(cronjob);
        this.catchUpIfMissed(cronjob);
      }
      this.logger.log(`Registered ${active.length} active cronjobs`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Bootstrap failed: ${message}. Cronjobs NOT registered.`);
    }
  }

  findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const cronjob = await this.repository.findById(id);
    if (!cronjob) {
      throw new NotFoundException(`Cronjob con ID "${id}" no encontrado`);
    }
    return cronjob;
  }

  async create(dto: CreateCronjobDto) {
    this.validateCronExpression(dto.cronExpression);
    const cronjob = await this.repository.create(dto);
    if (cronjob.isActive) {
      this.registerCronJob(cronjob);
    }
    return cronjob;
  }

  async update(id: string, dto: UpdateCronjobDto) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Cronjob con ID "${id}" no encontrado`);
    }
    if (dto.cronExpression !== undefined) {
      this.validateCronExpression(dto.cronExpression);
    }
    const updated = await this.repository.update(id, dto);
    this.unregisterCronJob(id);
    if (updated.isActive) {
      this.registerCronJob(updated);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Cronjob con ID "${id}" no encontrado`);
    }
    this.unregisterCronJob(id);
    await this.repository.delete(id);
  }

  async toggle(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Cronjob con ID "${id}" no encontrado`);
    }
    const updated = await this.repository.update(id, { isActive: !existing.isActive });
    if (updated.isActive) {
      this.registerCronJob(updated);
    } else {
      this.unregisterCronJob(id);
    }
    return updated;
  }

  async upsertSchedule(
    connectionId: string,
    cronExpression: string,
    name: string,
    frequency: CronFrequency,
  ): Promise<CronjobEntity> {
    this.validateCronExpression(cronExpression);
    const entity = await this.repository.upsertForConnection(connectionId, {
      name,
      cronExpression,
      frequency,
      isActive: true,
    });
    this.unregisterCronJob(entity.id);
    this.registerCronJob(entity);
    return entity;
  }

  private validateCronExpression(expression: string): void {
    try {
      new CronJob(expression, () => undefined);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Expresión cron inválida: "${expression}". ${detail}`,
      );
    }
  }

  private registerCronJob(cronjob: CronjobEntity): void {
    try {
      const job = new CronJob(cronjob.cronExpression, () => {
        // .catch() en vez de void: red de seguridad para que NUNCA un
        // unhandledRejection escape al process. Sin esto, en Node 22 un
        // error de DB / R2 / pg_dump tira el contenedor abajo.
        this.executeCronjob(cronjob.id).catch((err) => {
          this.logger.error(
            `Unhandled error in cronjob "${cronjob.name}": ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        });
      });
      this.schedulerRegistry.addCronJob(cronjob.id, job);
      job.start();
      this.logger.log(`Registered cronjob "${cronjob.name}" [${cronjob.cronExpression}]`);
    } catch (error) {
      this.logger.error(
        `Failed to register cronjob "${cronjob.name}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Capa 4 — Catch-up al boot. Si el proceso estuvo caído cuando un tick
  // debía dispararse, al reiniciar se detecta el tick perdido y se ejecuta
  // inmediatamente. Cubre el caso "API se reinició entre las 01:00 y 02:30,
  // se perdió el backup horario" sin necesidad de Redis/BullMQ.
  //
  // Usa el enum `frequency` (no la cron expression) porque cron v4 no expone
  // una API para "último tick esperado según la expresión": `lastDate()` solo
  // devuelve la última vez que la INSTANCIA disparó, lo cual es null para un
  // job recién creado al boot. El enum es la fuente de verdad del período
  // y ya está validado por @IsEnum al crear/actualizar el cronjob.
  //
  // Tolerancia de 1.5x el período: evita falsos positivos por jitter de
  // scheduler / clock drift sin permitir que un tick francamente perdido
  // pase desapercibido.
  private catchUpIfMissed(cronjob: CronjobEntity): void {
    try {
      const period = FREQUENCY_TO_PERIOD_MS[cronjob.frequency];
      if (!period) return; // CUSTOM no participa del catch-up

      const lastRun = cronjob.lastRunAt;
      if (!lastRun) {
        this.logger.warn(
          `Catch-up: cronjob "${cronjob.name}" never ran, executing now`,
        );
        this.fireCatchUp(cronjob);
        return;
      }

      const elapsed = Date.now() - lastRun.getTime();
      if (elapsed <= period * 1.5) return;

      this.logger.warn(
        `Catch-up: cronjob "${cronjob.name}" last ran ${Math.floor(elapsed / 60_000)}min ago (period ${Math.floor(period / 60_000)}min), executing now`,
      );
      this.fireCatchUp(cronjob);
    } catch (error) {
      this.logger.error(
        `Catch-up check failed for "${cronjob.name}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private fireCatchUp(cronjob: CronjobEntity): void {
    this.executeCronjob(cronjob.id).catch((err) => {
      this.logger.error(
        `Catch-up failed for "${cronjob.name}": ${err instanceof Error ? err.message : String(err)}`,
      );
    });
  }

  private unregisterCronJob(id: string): void {
    try {
      this.schedulerRegistry.deleteCronJob(id);
    } catch {
      // Normal if the cronjob was inactive and never registered
    }
  }

  private async executeCronjob(cronjobId: string): Promise<void> {
    const startedAt = new Date();
    let cronjobName = cronjobId;

    try {
      const cronjob = await this.repository.findById(cronjobId);
      if (!cronjob?.isActive) return;
      cronjobName = cronjob.name;

      this.logger.log(`Executing cronjob "${cronjob.name}" → connection ${cronjob.connectionId}`);

      await this.repository.updateRunMetadata(cronjobId, {
        lastRunAt: startedAt,
        lastStatus: JobStatus.RUNNING,
      });

      await this.backupService.createBackup(
        { connectionId: cronjob.connectionId },
        SYSTEM_USER,
        FREQUENCY_TO_CATEGORY[cronjob.frequency],
      );

      await this.repository.updateRunMetadata(cronjobId, {
        lastRunAt: startedAt,
        lastStatus: JobStatus.COMPLETED,
        nextRunAt: this.getNextRunDate(cronjobId),
      });

      this.logger.log(`Cronjob "${cronjob.name}" completed`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Cronjob "${cronjobName}" failed: ${message}`);

      // Best-effort: si el update del FAILED también falla (DB caída),
      // NO debe propagar — el catch externo del registerCronJob ya logueó.
      await this.repository
        .updateRunMetadata(cronjobId, {
          lastRunAt: startedAt,
          lastStatus: JobStatus.FAILED,
        })
        .catch((updateErr) => {
          this.logger.error(
            `Failed to record FAILED status for "${cronjobName}": ${
              updateErr instanceof Error ? updateErr.message : String(updateErr)
            }`,
          );
        });
    }
  }

  private getNextRunDate(cronjobId: string): Date | null {
    try {
      const job = this.schedulerRegistry.getCronJob(cronjobId);
      const next = job.nextDate();
      return typeof (next as unknown as { toJSDate?: () => Date }).toJSDate === 'function'
        ? (next as unknown as { toJSDate: () => Date }).toJSDate()
        : null;
    } catch {
      return null;
    }
  }
}
