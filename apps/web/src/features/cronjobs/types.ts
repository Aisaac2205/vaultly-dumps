import type { CronFrequency } from "@/types/backup.types";

export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface Connection {
  id: string;
  name: string;
  environment: string;
  dbType?: "postgres" | "mysql";
  host?: string;
  database?: string;
}

export interface Cronjob {
  id: string;
  name: string;
  connectionId: string;
  connectionName?: string;
  cronExpression: string;
  frequency: CronFrequency;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  lastStatus?: JobStatus;
}

export interface CreateCronjobDto {
  name: string;
  connectionId: string;
  cronExpression: string;
  frequency: CronFrequency;
}

export interface UpdateCronjobDto {
  name?: string;
  connectionId?: string;
  cronExpression?: string;
  frequency?: CronFrequency;
  isActive?: boolean;
}
