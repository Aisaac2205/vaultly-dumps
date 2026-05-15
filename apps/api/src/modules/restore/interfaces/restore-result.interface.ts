import { Environment } from '../../../database/enums/environment.enum';

export interface RestoreResult {
  jobId: string;
  isDryRun: boolean;
  targetEnvironment: Environment;
  startedAt: Date;
  completedAt: Date;
  success: boolean;
  error?: string;
}
