import type { BackupCategory } from "@/types/backup.types";
import type { EnrichedR2Object } from "@/features/dumps/types";

export type CleanupMode = "keepLast" | "olderThanDays";

export interface CleanupParams {
  connectionSlug: string;
  category: BackupCategory;
  olderThanDays?: number;
  keepLast?: number;
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
