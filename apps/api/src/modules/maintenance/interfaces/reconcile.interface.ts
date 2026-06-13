import { CleanupError } from './retention.interface';

export interface StaleDbRow {
  id: string;
  fileKey: string;
}

export interface OrphanDump {
  key: string;
  /** A dump with a manifest but no DB row is a complete, restorable backup. */
  hasManifest: boolean;
}

export interface ReconcilePreview {
  /** COMPLETED job rows whose fileKey is gone from R2 — stale, safe to remove. */
  staleDbRows: StaleDbRow[];
  /** `.manifest.json` objects with no `.dump` sibling — junk, safe to remove. */
  orphanManifests: string[];
  /** `.dump` objects with no DB row (hasManifest distinguishes junk from restorable). */
  orphanDumps: OrphanDump[];
}

export interface ReconcileResult {
  dbRowsDeleted: number;
  manifestsDeleted: number;
  /** Only orphan dumps WITHOUT a manifest (failed uploads) are deleted. */
  dumpsDeleted: number;
  /** Orphan dumps WITH a manifest — kept intact because they are restorable. */
  untrackedKept: number;
  errors: CleanupError[];
}
