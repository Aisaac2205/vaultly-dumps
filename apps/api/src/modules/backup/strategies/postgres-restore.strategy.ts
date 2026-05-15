import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { Client } from 'pg';
import { RestoreStrategy } from '../interfaces/restore-strategy.interface';
import { ConnectionEntity } from '../../../database/entities/connection.entity';

const TRUNCATE_TIMEOUT_MS = 30_000;
const RESTORE_TIMEOUT_MS = 300_000;

@Injectable()
export class PostgresRestoreStrategy implements RestoreStrategy {
  private readonly logger = new Logger(PostgresRestoreStrategy.name);

  async execute(
    connection: ConnectionEntity,
    filePath: string,
    onLog: (message: string) => void,
  ): Promise<void> {
    await this.truncateAllTables(connection);
    await this.runPgRestore(connection, filePath, onLog);
  }

  private async truncateAllTables(
    connection: ConnectionEntity,
  ): Promise<void> {
    const client = new Client({
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.username,
      password: connection.password,
      connectionTimeoutMillis: TRUNCATE_TIMEOUT_MS,
    });

    try {
      await client.connect();

      await client.query(`
        DO $$
        DECLARE r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
          LOOP
            EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
        END $$;
      `);
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  private runPgRestore(
    connection: ConnectionEntity,
    filePath: string,
    onLog: (message: string) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pgRestore.kill();
        reject(new Error(`pg_restore exceeded ${RESTORE_TIMEOUT_MS}ms timeout`));
      }, RESTORE_TIMEOUT_MS);

      const args = [
        '-h',
        connection.host,
        '-p',
        String(connection.port),
        '-U',
        connection.username,
        '-d',
        connection.database,
        '--no-owner',
        '--no-privileges',
        '--clean',
        '--if-exists',
        filePath,
      ];

      const pgRestore = spawn('pg_restore', args, {
        env: { ...process.env, PGPASSWORD: connection.password },
      });

      let stderrOutput = '';

      pgRestore.stderr.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        stderrOutput += text;
        const lines = text
          .split('\n')
          .filter((line) => line.trim().length > 0);

        for (const line of lines) {
          onLog(line);
        }
      });

      pgRestore.on('error', (error: Error) => {
        clearTimeout(timeout);
        reject(new Error(`pg_restore failed to start: ${error.message}`));
      });

      pgRestore.on('close', (code: number | null) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve();
        } else {
          const errorDetail = stderrOutput.trim() || `exit code ${code ?? 'unknown'}`;
          reject(
            new Error(
              `pg_restore exited with code ${code ?? 'unknown'}: ${errorDetail}`,
            ),
          );
        }
      });
    });
  }
}
