export interface DryRunResult {
  tableCount: number;
  estimatedRows: number;
  tables: Array<{ name: string; estimatedRows: number }>;
}
