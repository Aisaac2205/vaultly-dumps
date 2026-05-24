export interface DryRunSnapshot {
  tableCount: number;
  estimatedRows: number;
  tables: Array<{ name: string; estimatedRows: number }>;
}

export interface DryRunDiff {
  added: string[];
  removed: string[];
  common: Array<{ name: string; sourceRows: number; targetRows: number }>;
}

export interface DryRunResult {
  source: DryRunSnapshot | null;
  target: DryRunSnapshot;
  diff: DryRunDiff | null;
  manifestAvailable: boolean;
}
