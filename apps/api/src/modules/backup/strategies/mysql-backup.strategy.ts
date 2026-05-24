import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { Transform } from 'stream';
import { BackupStrategy } from '../interfaces/backup-strategy.interface';
import { R2Service } from '../r2.service';
import { ConnectionEntity } from '../../../database/entities/connection.entity';

@Injectable()
export class MySQLBackupStrategy implements BackupStrategy {
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
        (fn as (v: unknown) => void)(value);
      };

      const args = [
        '-h', connection.host,
        '-P', String(connection.port),
        '-u', connection.username,
        '--routines',
        '--triggers',
        '--events',
        '--single-transaction',
        '--no-tablespaces',
        connection.database,
      ];

      // MYSQL_PWD keeps the password out of the process arg list (not visible in ps aux)
      const mySqlDump = spawn('mysqldump', args, {
        env: { ...process.env, MYSQL_PWD: connection.password },
      });

      let totalBytes = 0;
      const counter = new Transform({
        transform(chunk: Buffer, _enc, cb) {
          totalBytes += chunk.length;
          cb(null, chunk);
        },
      });

      mySqlDump.stderr.on('data', (chunk: Buffer) => {
        stderrBuffer += chunk.toString();
      });

      mySqlDump.on('error', (err: Error) => {
        const error = new Error(`mysqldump failed to start: ${err.message}`);
        counter.destroy(error);
        settle(reject, error);
      });

      const uploadPromise = this.r2Service.upload(fileKey, counter, { metadata });

      mySqlDump.stdout.pipe(counter);

      mySqlDump.on('close', (code: number | null) => {
        if (code !== 0) {
          const detail = stderrBuffer.trim() || `exit code ${code ?? 'unknown'}`;
          const error = new Error(`mysqldump failed: ${detail}`);
          counter.destroy(error);
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
