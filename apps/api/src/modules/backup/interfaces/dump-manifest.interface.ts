export interface DumpManifestTable {
  name: string;
  estimatedRows: number;
}

export interface DumpManifestSource {
  serverVersion: string;
  tableCount: number;
  estimatedRows: number;
  tables: DumpManifestTable[];
}

export interface DumpManifest {
  version: 1;
  createdAt: string;
  dbType: string;
  database: string;
  source: DumpManifestSource;
}
