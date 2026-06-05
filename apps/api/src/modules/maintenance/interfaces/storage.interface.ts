import { BackupCategory } from '../../../database/enums/backup-category.enum';

export interface StorageConnectionUsage {
  connectionSlug: string;
  connectionName: string;
  count: number;
  sizeMb: number;
  oldest: string | null; // ISO date of the oldest dump, or null
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
