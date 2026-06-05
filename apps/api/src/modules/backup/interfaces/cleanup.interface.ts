import { EnrichedR2Object } from './enriched-r2-object.interface';

/**
 * Result of a cleanup preview (dry run): the exact dumps that WOULD be
 * deleted for the requested connection + category + retention criteria.
 */
export interface CleanupPreview {
  items: EnrichedR2Object[];
  count: number;
  totalSizeMb: number;
}

/** A single dump that could not be removed from R2 during cleanup. */
export interface CleanupError {
  key: string;
  message: string;
}

/**
 * Result of an executed cleanup. Partial failures do not abort the run —
 * every error is collected and reported here.
 */
export interface CleanupResult {
  deleted: number;
  freedMb: number;
  errors: CleanupError[];
}
