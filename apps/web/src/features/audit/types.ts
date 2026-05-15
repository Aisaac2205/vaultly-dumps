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

export type Environment = "prod" | "dev" | "sqa";

export interface AuditLog {
  id: string;
  action: AuditAction | string;
  userId: string;
  username: string;
  resourceType: ResourceType | string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  environment: Environment | string;
  createdAt: string; // ISO date
}

export interface AuditFilters {
  userId?: string;
  username?: string;
  environment?: Environment | string;
  resourceType?: ResourceType | string;
  from?: string; // ISO date
  to?: string; // ISO date
}
