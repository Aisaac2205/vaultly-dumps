export type AuditAction =
  | "backup.created"
  | "backup.deleted"
  | "restore.started"
  | "restore.completed"
  | "restore.failed"
  | "connection.created"
  | "connection.updated"
  | "connection.deleted"
  | "cronjob.created"
  | "cronjob.updated"
  | "cronjob.deleted"
  | "cronjob.toggled";

export type ResourceType = "backup" | "restore" | "connection" | "cronjob";

export type Environment = "prod" | "dev" | "qa";

export type AuditOutcome = "success" | "failure";

export type AuditSeverity = "low" | "medium" | "high" | "critical";

export interface AuditLog {
  id: string;
  action: AuditAction | string;
  userId: string;
  username: string;
  resourceType: ResourceType | string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  /** Null for authentication events, which belong to no ERP environment. */
  environment: Environment | string | null;
  createdAt: string; // ISO date
  ipAddress?: string | null;
  userAgent?: string | null;
  outcome?: AuditOutcome;
  severity?: AuditSeverity;
}

export interface AuditFilters {
  userId?: string;
  username?: string;
  environment?: Environment | string;
  resourceType?: ResourceType | string;
  from?: string; // ISO date
  to?: string; // ISO date
}
