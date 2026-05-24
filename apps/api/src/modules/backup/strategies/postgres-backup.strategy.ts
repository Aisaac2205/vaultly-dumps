import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { Transform } from 'stream';
import { BackupStrategy } from '../interfaces/backup-strategy.interface';
import { R2Service } from '../r2.service';
import { ConnectionEntity } from '../../../database/entities/connection.entity';

const BACKUP_TIMEOUT_MS = 600_000;

@Injectable()
export class PostgresBackupStrategy implements BackupStrategy {
  constructor(private readonly r2Service: R2Service) {}

  execute(
    connection: ConnectionEntity,
    fileKey: string,
    metadata?: Record<string, string>,
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      let stderrBuffer = '';
      let settled = false;

      const settle = (fn: typeof resolve | typeof reject, value: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        (fn as (v: unknown) => void)(value);
      };

      const args = [
        '-h', connection.host,
        '-p', String(connection.port),
        '-U', connection.username,
        '-d', connection.database,
        '-F', 'c',
        '--no-password',
      ];

      const pgDump = spawn('pg_dump', args, {
        env: { ...process.env, PGPASSWORD: connection.password },
      });

      const timeout = setTimeout(() => {
        pgDump.kill();
        settle(reject, new Error(`pg_dump exceeded ${BACKUP_TIMEOUT_MS}ms timeout`));
      }, BACKUP_TIMEOUT_MS);

      let totalBytes = 0;
      const counter = new Transform({
        transform(chunk: Buffer, _enc, cb) {
          totalBytes += chunk.length;
          cb(null, chunk);
        },
      });

      pgDump.stderr.on('data', (chunk: Buffer) => {
        stderrBuffer += chunk.toString();
      });

      pgDump.on('error', (err: Error) => {
        const error = new Error(`pg_dump failed to start: ${err.message}`);
        counter.destroy(error);
        settle(reject, error);
      });

      // Pipe BEFORE starting the upload to avoid the readable side
      // emitting an early EOF on some Node.js versions.
      pgDump.stdout.pipe(counter);

      const uploadPromise = this.r2Service.upload(fileKey, counter, { metadata });

      pgDump.on('close', (code: number | null) => {
        if (code !== 0) {
          const detail = stderrBuffer.trim() || `exit code ${code ?? 'unknown'}`;
          const error = new Error(`pg_dump failed: ${detail}`);
          counter.destroy(error);
          uploadPromise.catch(() => {});
          settle(reject, error);
          return;
        }

        uploadPromise
          .then(() => settle(resolve, totalBytes / (1024 * 1024)))
          .catch((err: Error) => settle(reject, new Error(`R2 upload failed: ${err.message}`)));
      });
    });
  }
}
