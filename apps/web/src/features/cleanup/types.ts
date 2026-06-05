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
