import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { Transform } from 'stream';
import { BackupStrategy } from '../interfaces/backup-strategy.interface';
import { R2Service } from '../r2.service';
import { ConnectionEntity } from '../../../database/entities/connection.entity';

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
      let uploadError: Error | null = null;

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
        // Destroy the upload-bound stream so lib-storage aborts the multipart
        // instead of completing it with whatever bytes already shipped.
        counter.destroy(error);
        reject(error);
      });

      // close is the single source of truth — upload result is captured via uploadError
      pgDump.on('close', (code: number | null) => {
        if (uploadError) {
          reject(new Error(`R2 upload failed: ${uploadError.message}`));
          return;
        }
        if (code !== 0) {
          const detail = stderrBuffer.trim() || `exit code ${code ?? 'unknown'}`;
          const error = new Error(`pg_dump failed: ${detail}`);
          // Force lib-storage to abort the multipart so a truncated dump is
          // never committed to R2 as a "successful" object.
          counter.destroy(error);
          reject(error);
          return;
        }
        resolve(totalBytes / (1024 * 1024));
      });

      pgDump.stdout.pipe(counter);

      this.r2Service.upload(fileKey, counter, { metadata }).catch((err: Error) => {
        uploadError = err;
        pgDump.kill('SIGTERM');
      });
    });
  }
}
