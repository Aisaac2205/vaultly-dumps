export interface Connection {
  id: string;
  name: string;
  slug: string;
  dbType: "postgres" | "mysql";
  environment: string;
  host: string;
  port: number;
  database: string;
  username: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConnectionDto {
  name: string;
  dbType: "postgres" | "mysql";
  environment: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface UpdateConnectionDto {
  name?: string;
  dbType?: "postgres" | "mysql";
  environment?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  latencyMs: number; // milliseconds
  error?: string;
}

export interface TestRawConnectionDto {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  dbType: "postgres" | "mysql";
}
