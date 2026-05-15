export interface BackupResult {
  jobId: string;
  fileKey: string;
  fileSizeMb: number;
  startedAt: Date;
  completedAt: Date;
}
