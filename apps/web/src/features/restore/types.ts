export type RestoreState = "idle" | "dry-run" | "confirming" | "running" | "done";

export interface DryRunTable {
  name: string;
  estimatedRows: number;
}

export interface DryRunResult {
  tableCount: number;
  estimatedRows: number;
  tables: DryRunTable[];
}

export interface RestoreJob {
  id: string;
  sourceBackupId?: string | null;
  r2Key?: string | null;
  targetConnectionId?: string;
  targetEnvironment?: string;
  status: "pending" | "running" | "completed" | "failed";
  isDryRun?: boolean;
  startedAt?: string;
  completedAt?: string | null;
  errorMessage?: string | null;
  triggeredBy?: string;
  createdAt: string;
}

export interface Connection {
  id: string;
  name: string;
  slug: string;
  environment: string;
  dbType: "postgres" | "mysql";
  host: string;
  port: number;
  database: string;
  username?: string;
  isActive: boolean;
}

export interface RestoreDto {
  sourceBackupId?: string;
  r2Key?: string;
  targetConnectionId: string;
  isDryRun: boolean;
}

export interface RestoreExecuteResult {
  jobId: string;
  dryRunResult?: DryRunResult;
  status?: string;
}

// SSE Event Types
export type SseEventType = "progress" | "log" | "completed" | "failed";

export interface SseProgressEvent {
  type: "progress";
  payload: { percent: number };
}

export interface SseLogEvent {
  type: "log";
  payload: { message: string; timestamp: string };
}

export interface SseCompletedEvent {
  type: "completed";
  payload: { jobId: string; completedAt: string };
}

export interface SseFailedEvent {
  type: "failed";
  payload: { jobId: string; error: string };
}

export type SseEvent =
  | SseProgressEvent
  | SseLogEvent
  | SseCompletedEvent
  | SseFailedEvent;
