import { BackupCategory } from '../../../database/enums/backup-category.enum';

export interface EnrichedR2Object {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  connectionId: string;
  connectionSlug: string;
  connectionName: string;
  dbType: 'postgres' | 'mysql' | null;
  category: BackupCategory;
  timestamp: string; // parsed from filename
}
