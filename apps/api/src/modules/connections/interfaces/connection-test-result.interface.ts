export interface ConnectionTestResult {
  success: boolean;
  latencyMs?: number;
  error?: string;
}
