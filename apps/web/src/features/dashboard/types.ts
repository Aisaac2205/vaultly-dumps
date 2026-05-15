export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface JobSummary {
  total: number;
  completed: number;
  pending: number;
  running: number;
  failed: number;
}

export interface BackupJob {
  id: string;
  connectionId: string;
  connectionName: string;
  environment: string;
  status: JobStatus;
  fileKey: string | null;
  fileSizeMb: number | null;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  triggeredBy: string;
  createdAt: string;
}

export interface RestoreJob {
  id: string;
  targetConnectionId: string;
  targetEnvironment: string;
  isDryRun: boolean;
  status: JobStatus;
  createdAt: string;
}

export interface ConnectionEntity {
  id: string;
  name: string;
  dbType: string;
  environment: string;
  isActive: boolean;
}

export interface CronjobEntity {
  id: string;
  name: string;
  isActive: boolean;
  schedule: string;
  connectionId: string;
}

export interface HealthStatus {
  status: string;
  info: {
    database: {
      status: string;
    };
  };
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  environment: string;
  createdAt: string;
}

export interface R2Object {
  key: string;
  size: number;
  lastModified: string;
  etag: string;
}
