import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BackupService } from '../backup/backup.service';
import { BackupRepository } from '../backup/backup.repository';
import { R2Service } from '../backup/r2.service';
import { RestoreRepository } from '../restore/restore.repository';
import { ConnectionsService } from '../connections/connections.service';
import { EnrichedR2Object } from '../backup/interfaces/enriched-r2-object.interface';
import { ManualRetentionSettingEntity } from '../../database/entities/manual-retention-setting.entity';
import { BackupCategory } from '../../database/enums/backup-category.enum';
import { JobStatus } from '../../database/enums/job-status.enum';
import { CleanupParamsDto } from './dto/cleanup-params.dto';
import { UpdateManualRetentionDto } from './dto/update-manual-retention.dto';
import {
  CleanupError,
  CleanupPreview,
  CleanupResult,
  RetentionPolicy,
} from './interfaces/retention.interface';
import {
  StorageCategoryUsage,
  StorageConnectionUsage,
  StorageOverview,
} from './interfaces/storage.interface';
import {
  DbHygienePreview,
  DbHygieneResult,
} from './interfaces/db-hygiene.interface';
import {
  OrphanDump,
  ReconcilePreview,
  ReconcileResult,
  StaleDbRow,
} from './interfaces/reconcile.interface';

const BYTES_PER_MB = 1024 * 1024;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MANUAL_SWEEP_LOCK_ID = 778_716_811;

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    private readonly backupService: BackupService,
    private readonly backupRepository: BackupRepository,
    private readonly r2Service: R2Service,
    private readonly restoreRepository: RestoreRepository,
    private readonly connectionsService: ConnectionsService,
    @InjectRepository(ManualRetentionSettingEntity)
    private readonly manualRetentionRepo: Repository<ManualRetentionSettingEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // --- Ad-hoc cleanup (manual UI) -----------------------------------------

  async previewCleanup(params: CleanupParamsDto): Promise<CleanupPreview> {
    this.assertHasCriterion(params);
    const items = await this.selectForDeletion(params.connectionSlug, params.category, params);
    return this.toPreview(items);
  }

  async runCleanup(params: CleanupParamsDto): Promise<CleanupResult> {
    this.assertHasCriterion(params);
    return this.prune(params.connectionSlug, params.category, params);
  }

  // --- Automatic retention (cronjobs / sweeper) ---------------------------

  /**
   * Applies a retention policy to one connection + category. Used by the cron
   * after each scheduled backup and by the manual sweeper. No-op (returns an
   * empty result) when the policy has no criteria.
   */
  async applyRetention(
    connectionSlug: string,
    category: BackupCategory,
    policy: RetentionPolicy,
  ): Promise<CleanupResult> {
    if (!this.hasCriterion(policy)) {
      return { deleted: 0, freedMb: 0, errors: [] };
    }
    return this.prune(connectionSlug, category, policy);
  }

  // --- Global manual-dump retention + daily sweeper -----------------------

  /** Current global manual-dump retention policy (transient default if unset). */
  async getManualRetention(): Promise<ManualRetentionSettingEntity> {
    const existing = await this.manualRetentionRepo.findOne({ where: { id: 1 } });
    return (
      existing ??
      this.manualRetentionRepo.create({
        id: 1,
        enabled: false,
        keepLast: null,
        maxAgeDays: null,
        maxTotalSizeMb: null,
      })
    );
  }

  /** Full-replace of the global manual-dump retention policy (singleton row). */
  async updateManualRetention(
    dto: UpdateManualRetentionDto,
  ): Promise<ManualRetentionSettingEntity> {
    const entity = this.manualRetentionRepo.create({
      id: 1,
      enabled: dto.enabled ?? false,
      keepLast: dto.keepLast ?? null,
      maxAgeDays: dto.maxAgeDays ?? null,
      maxTotalSizeMb: dto.maxTotalSizeMb ?? null,
    });
    return this.manualRetentionRepo.save(entity);
  }

  /**
   * Daily sweep: applies the global manual-dump retention to every connection.
   * Guarded by a pg advisory lock so only one replica runs it; wrapped so a
   * failure never crashes the process.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async sweepManualRetention(): Promise<void> {
    try {
      const lock = await this.dataSource.query<Array<{ acquired: boolean }>>(
        'SELECT pg_try_advisory_lock($1) AS acquired',
        [MANUAL_SWEEP_LOCK_ID],
      );
      if (!lock[0]?.acquired) return;

      try {
        const settings = await this.getManualRetention();
        if (!settings.enabled) return;

        const policy: RetentionPolicy = {
          keepLast: settings.keepLast ?? undefined,
          maxAgeDays: settings.maxAgeDays ?? undefined,
          maxTotalSizeMb: settings.maxTotalSizeMb ?? undefined,
        };
        if (!this.hasCriterion(policy)) return;

        const connections = await this.connectionsService.findAll();
        for (const connection of connections) {
          try {
            const result = await this.applyRetention(
              connection.slug,
              BackupCategory.MANUAL,
              policy,
            );
            if (result.deleted > 0) {
              this.logger.log(
                `Manual sweep "${connection.slug}": pruned ${result.deleted} (${result.freedMb} MB)`,
              );
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(
              `Manual sweep failed for "${connection.slug}": ${message}`,
            );
          }
        }
      } finally {
        await this.dataSource.query('SELECT pg_advisory_unlock($1)', [
          MANUAL_SWEEP_LOCK_ID,
        ]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`sweepManualRetention crashed: ${message}`);
    }
  }

  // --- Storage overview ---------------------------------------------------

  /** Aggregates R2 dump usage by connection and by category. Read-only. */
  async getStorageOverview(): Promise<StorageOverview> {
    const objects = await this.r2Service.list();
    const dumps = objects.filter((obj) => obj.key.endsWith('.dump'));

    const connections = await this.connectionsService.findAll();
    const nameBySlug = new Map(connections.map((c) => [c.slug, c.name]));

    const byConn = new Map<
      string,
      { count: number; bytes: number; oldest: number | null }
    >();
    const byCat = new Map<string, { count: number; bytes: number }>();
    let totalBytes = 0;

    for (const obj of dumps) {
      const [slug, category] = obj.key.split('/');
      if (!slug || !category) continue;
      totalBytes += obj.size;

      const conn = byConn.get(slug) ?? { count: 0, bytes: 0, oldest: null };
      conn.count += 1;
      conn.bytes += obj.size;
      const ts = obj.lastModified.getTime();
      conn.oldest = conn.oldest === null ? ts : Math.min(conn.oldest, ts);
      byConn.set(slug, conn);

      const cat = byCat.get(category) ?? { count: 0, bytes: 0 };
      cat.count += 1;
      cat.bytes += obj.size;
      byCat.set(category, cat);
    }

    const byConnection: StorageConnectionUsage[] = [...byConn.entries()]
      .map(([slug, v]) => ({
        connectionSlug: slug,
        connectionName: nameBySlug.get(slug) ?? slug,
        count: v.count,
        sizeMb: this.bytesToMb(v.bytes),
        oldest: v.oldest === null ? null : new Date(v.oldest).toISOString(),
      }))
      .sort((a, b) => b.sizeMb - a.sizeMb);

    const byCategory: StorageCategoryUsage[] = [...byCat.entries()]
      .map(([category, v]) => ({
        category: category as BackupCategory,
        count: v.count,
        sizeMb: this.bytesToMb(v.bytes),
      }))
      .sort((a, b) => b.sizeMb - a.sizeMb);

    return {
      totalDumps: dumps.length,
      totalSizeMb: this.bytesToMb(totalBytes),
      byConnection,
      byCategory,
    };
  }

  // --- DB hygiene (prune FAILED job rows) ---------------------------------

  async previewDbHygiene(olderThanDays: number): Promise<DbHygienePreview> {
    const cutoff = new Date(Date.now() - olderThanDays * MS_PER_DAY);
    const failedCount = await this.backupRepository.countFailedOlderThan(cutoff);
    return { failedCount };
  }

  async runDbHygiene(olderThanDays: number): Promise<DbHygieneResult> {
    const cutoff = new Date(Date.now() - olderThanDays * MS_PER_DAY);
    const deleted = await this.backupRepository.deleteFailedOlderThan(cutoff);
    return { deleted };
  }

  // --- Reconciliation (R2 <-> DB drift) -----------------------------------

  /**
   * Detects drift between R2 and the DB. Read-only.
   * - staleDbRows: COMPLETED rows whose dump is gone from R2.
   * - orphanManifests: manifests with no dump sibling.
   * - orphanDumps: dumps with no DB row (hasManifest = restorable vs junk).
   */
  async reconcilePreview(): Promise<ReconcilePreview> {
    const objects = await this.r2Service.list();
    const dumpKeys = new Set(
      objects.filter((o) => o.key.endsWith('.dump')).map((o) => o.key),
    );
    const manifestKeys = new Set(
      objects.filter((o) => o.key.endsWith('.manifest.json')).map((o) => o.key),
    );

    const { data: jobs } = await this.backupRepository.findAll();
    const jobFileKeys = new Set(
      jobs
        .map((j) => j.fileKey)
        .filter((key): key is string => key !== null),
    );

    const staleDbRows: StaleDbRow[] = jobs
      .filter(
        (j) =>
          j.status === JobStatus.COMPLETED &&
          j.fileKey !== null &&
          !dumpKeys.has(j.fileKey),
      )
      .map((j) => ({ id: j.id, fileKey: j.fileKey as string }));

    const orphanDumps: OrphanDump[] = [...dumpKeys]
      .filter((key) => !jobFileKeys.has(key))
      .map((key) => ({
        key,
        hasManifest: manifestKeys.has(key.replace(/\.dump$/, '.manifest.json')),
      }));

    const orphanManifests: string[] = [...manifestKeys].filter(
      (mk) => !dumpKeys.has(mk.replace(/\.manifest\.json$/, '.dump')),
    );

    return { staleDbRows, orphanManifests, orphanDumps };
  }

  /**
   * Cleans only the unambiguously-safe drift: stale DB rows, orphan manifests,
   * and orphan dumps WITHOUT a manifest (failed uploads). Orphan dumps WITH a
   * manifest are restorable and are kept intact. Partial failures are reported.
   */
  async reconcileRun(): Promise<ReconcileResult> {
    const preview = await this.reconcilePreview();
    const errors: CleanupError[] = [];

    const dbRowsDeleted = await this.backupRepository.deleteByIds(
      preview.staleDbRows.map((r) => r.id),
    );

    let manifestsDeleted = 0;
    for (const key of preview.orphanManifests) {
      try {
        await this.r2Service.delete(key);
        manifestsDeleted += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ key, message });
      }
    }

    let dumpsDeleted = 0;
    let untrackedKept = 0;
    for (const dump of preview.orphanDumps) {
      if (dump.hasManifest) {
        untrackedKept += 1; // restorable — never auto-delete
        continue;
      }
      try {
        await this.r2Service.delete(dump.key);
        dumpsDeleted += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ key: dump.key, message });
      }
    }

    return {
      dbRowsDeleted,
      manifestsDeleted,
      dumpsDeleted,
      untrackedKept,
      errors,
    };
  }

  // --- Core engine --------------------------------------------------------

  private async prune(
    connectionSlug: string,
    category: BackupCategory,
    policy: RetentionPolicy,
  ): Promise<CleanupResult> {
    const items = await this.selectForDeletion(connectionSlug, category, policy);

    const errors: CleanupError[] = [];
    const deletedKeys: string[] = [];
    let freedBytes = 0;

    for (const item of items) {
      try {
        await this.r2Service.delete(item.key);
        deletedKeys.push(item.key);
        freedBytes += item.size;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ key: item.key, message });
        continue;
      }

      const manifestKey = item.key.replace(/\.dump$/, '.manifest.json');
      try {
        await this.r2Service.delete(manifestKey);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ key: manifestKey, message });
      }
    }

    await this.backupRepository.deleteByFileKeys(deletedKeys);

    return {
      deleted: deletedKeys.length,
      freedMb: this.bytesToMb(freedBytes),
      errors,
    };
  }

  /**
   * Resolves which dumps to delete. Dumps arrive newest-first.
   * Hard floor: never delete the newest `max(keepLast, 1)` nor any dump that is
   * the source of a running restore. Beyond the floor a dump is deleted when it
   * matches any active trigger (age / size), or unconditionally if keepLast is
   * the only criterion.
   */
  private async selectForDeletion(
    connectionSlug: string,
    category: BackupCategory,
    policy: RetentionPolicy,
  ): Promise<EnrichedR2Object[]> {
    const dumps = await this.backupService.listEnrichedDumps(connectionSlug, category);
    if (dumps.length === 0) return [];

    const inUse = await this.getInUseFileKeys();

    const protectedCount = Math.max(policy.keepLast ?? 0, 1);
    const cutoff =
      policy.maxAgeDays != null ? Date.now() - policy.maxAgeDays * MS_PER_DAY : null;
    const capBytes =
      policy.maxTotalSizeMb != null ? policy.maxTotalSizeMb * BYTES_PER_MB : null;
    const keepLastOnly = policy.maxAgeDays == null && policy.maxTotalSizeMb == null;

    const toDelete: EnrichedR2Object[] = [];
    let cumulative = 0;

    dumps.forEach((dump, index) => {
      cumulative += dump.size;
      if (index < protectedCount) return; // hard floor, keeps >= 1
      if (inUse.has(dump.key)) return; // restore-aware

      const tooOld = cutoff != null && dump.lastModified.getTime() < cutoff;
      const overCap = capBytes != null && cumulative > capBytes;
      if (keepLastOnly || tooOld || overCap) {
        toDelete.push(dump);
      }
    });

    return toDelete;
  }

  /** File keys that are the source of a RUNNING restore — must never be pruned. */
  private async getInUseFileKeys(): Promise<Set<string>> {
    const running = await this.restoreRepository.findByStatus(JobStatus.RUNNING);
    const keys = new Set<string>();
    for (const job of running) {
      if (job.r2Key) {
        keys.add(job.r2Key);
      } else if (job.sourceBackupId) {
        const backup = await this.backupRepository.findById(job.sourceBackupId);
        if (backup?.fileKey) keys.add(backup.fileKey);
      }
    }
    return keys;
  }

  private toPreview(items: EnrichedR2Object[]): CleanupPreview {
    const totalBytes = items.reduce((sum, item) => sum + item.size, 0);
    return { items, count: items.length, totalSizeMb: this.bytesToMb(totalBytes) };
  }

  private hasCriterion(policy: RetentionPolicy): boolean {
    return (
      policy.keepLast != null ||
      policy.maxAgeDays != null ||
      policy.maxTotalSizeMb != null
    );
  }

  private assertHasCriterion(policy: RetentionPolicy): void {
    if (!this.hasCriterion(policy)) {
      throw new BadRequestException(
        'Debe indicar al menos un criterio: "keepLast", "maxAgeDays" o "maxTotalSizeMb".',
      );
    }
  }

  private bytesToMb(bytes: number): number {
    return Number((bytes / BYTES_PER_MB).toFixed(2));
  }
}
