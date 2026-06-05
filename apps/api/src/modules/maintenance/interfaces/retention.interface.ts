import { EnrichedR2Object } from '../../backup/interfaces/enriched-r2-object.interface';

/**
 * Retention policy shared by ad-hoc cleanup, cronjob retention and the manual
 * sweeper. All fields optional; the engine requires at least one to be set.
 *
 * Combination (protective): the newest `max(keepLast, 1)` dumps are NEVER
 * deleted. Beyond that floor a dump is pruned if it matches ANY active trigger
 * (older than `maxAgeDays`, or cumulative size past `maxTotalSizeMb`). When only
 * `keepLast` is set, everything beyond the floor is pruned.
 */
export interface RetentionPolicy {
  keepLast?: number;
  maxAgeDays?: number;
  maxTotalSizeMb?: number;
}

export interface CleanupPreview {
  items: EnrichedR2Object[];
  count: number;
  totalSizeMb: number;
}

export interface CleanupError {
  key: string;
  message: string;
}

export interface CleanupResult {
  deleted: number;
  freedMb: number;
  errors: CleanupError[];
}
