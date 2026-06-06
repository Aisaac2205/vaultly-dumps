import type { BackupCategory } from "@/types/backup.types";
import type { EnrichedR2Object } from "@/features/dumps/types";

export type CleanupMode = "keepLast" | "maxAgeDays";

export interface CleanupParams {
  connectionSlug: string;
  category: BackupCategory;
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

export interface ManualRetentionSettings {
  enabled: boolean;
  keepLast: number | null;
  maxAgeDays: number | null;
  maxTotalSizeMb: number | null;
  updatedAt?: string;
}

export interface ManualRetentionUpdate {
  enabled?: boolean;
  keepLast?: number;
  maxAgeDays?: number;
  maxTotalSizeMb?: number;
}

export interface StorageConnectionUsage {
  connectionSlug: string;
  connectionName: string;
  count: number;
  sizeMb: number;
  oldest: string | null;
}

export interface StorageCategoryUsage {
  category: BackupCategory;
  count: number;
  sizeMb: number;
}

export interface StorageOverview {
  totalDumps: number;
  totalSizeMb: number;
  byConnection: StorageConnectionUsage[];
  byCategory: StorageCategoryUsage[];
}

export interface DbHygienePreview {
  failedCount: number;
}

export interface DbHygieneResult {
  deleted: number;
}

export interface StaleDbRow {
  id: string;
  fileKey: string;
}

export interface OrphanDump {
  key: string;
  hasManifest: boolean;
}

export interface ReconcilePreview {
  staleDbRows: StaleDbRow[];
  orphanManifests: string[];
  orphanDumps: OrphanDump[];
}

export interface ReconcileResult {
  dbRowsDeleted: number;
  manifestsDeleted: number;
  dumpsDeleted: number;
  untrackedKept: number;
  errors: CleanupError[];
}
