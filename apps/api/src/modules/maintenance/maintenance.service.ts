import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { BackupService } from '../backup/backup.service';
import { BackupRepository } from '../backup/backup.repository';
import { R2Service } from '../backup/r2.service';
import { RestoreRepository } from '../restore/restore.repository';
import { EnrichedR2Object } from '../backup/interfaces/enriched-r2-object.interface';
import { BackupCategory } from '../../database/enums/backup-category.enum';
import { JobStatus } from '../../database/enums/job-status.enum';
import { CleanupParamsDto } from './dto/cleanup-params.dto';
import {
  CleanupError,
  CleanupPreview,
  CleanupResult,
  RetentionPolicy,
} from './interfaces/retention.interface';

const BYTES_PER_MB = 1024 * 1024;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    private readonly backupService: BackupService,
    private readonly backupRepository: BackupRepository,
    private readonly r2Service: R2Service,
    private readonly restoreRepository: RestoreRepository,
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
