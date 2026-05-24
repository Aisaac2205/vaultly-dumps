import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { RestoreStrategy } from '../interfaces/restore-strategy.interface';
import { ConnectionEntity } from '../../../database/entities/connection.entity';

const RESTORE_TIMEOUT_MS = 300_000;

@Injectable()
export class PostgresRestoreStrategy implements RestoreStrategy {
  private readonly logger = new Logger(PostgresRestoreStrategy.name);

  async execute(
    connection: ConnectionEntity,
    filePath: string,
    onLog: (message: string) => void,
  ): Promise<void> {
    await this.runPgRestore(connection, filePath, onLog);
  }

  private runPgRestore(
    connection: ConnectionEntity,
    filePath: string,
    onLog: (message: string) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const settle = (fn: typeof resolve | typeof reject, value?: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        (fn as (v?: unknown) => void)(value);
      };

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

      const timeout = setTimeout(() => {
        pgRestore.kill();
        settle(reject, new Error(`pg_restore exceeded ${RESTORE_TIMEOUT_MS}ms timeout`));
      }, RESTORE_TIMEOUT_MS);

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
        settle(reject, new Error(`pg_restore failed to start: ${error.message}`));
      });

      pgRestore.on('close', (code: number | null) => {
        if (code === 0) {
          settle(resolve);
        } else {
          const errorDetail = stderrOutput.trim() || `exit code ${code ?? 'unknown'}`;
          settle(
            reject,
            new Error(`pg_restore exited with code ${code ?? 'unknown'}: ${errorDetail}`),
          );
        }
      });
    });
  }
}
