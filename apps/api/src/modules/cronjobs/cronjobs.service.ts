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
    const active = await this.repository.findAllActive();
    for (const cronjob of active) {
      this.registerCronJob(cronjob);
    }
    this.logger.log(`Registered ${active.length} active cronjobs`);
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
        void this.executeCronjob(cronjob.id);
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

  private unregisterCronJob(id: string): void {
    try {
      this.schedulerRegistry.deleteCronJob(id);
    } catch {
      // Normal if the cronjob was inactive and never registered
    }
  }

  private async executeCronjob(cronjobId: string): Promise<void> {
    const cronjob = await this.repository.findById(cronjobId);
    if (!cronjob?.isActive) return;

    this.logger.log(`Executing cronjob "${cronjob.name}" → connection ${cronjob.connectionId}`);
    const startedAt = new Date();

    await this.repository.updateRunMetadata(cronjobId, {
      lastRunAt: startedAt,
      lastStatus: JobStatus.RUNNING,
    });

    try {
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
      this.logger.error(`Cronjob "${cronjob.name}" failed: ${message}`);

      await this.repository.updateRunMetadata(cronjobId, {
        lastRunAt: startedAt,
        lastStatus: JobStatus.FAILED,
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
