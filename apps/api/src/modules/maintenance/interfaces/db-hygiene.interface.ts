export interface DbHygienePreview {
  /** FAILED backup_jobs rows older than the cutoff that would be removed. */
  failedCount: number;
}

export interface DbHygieneResult {
  deleted: number;
}
