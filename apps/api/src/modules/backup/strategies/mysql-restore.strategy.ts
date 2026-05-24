import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { RestoreStrategy } from '../interfaces/restore-strategy.interface';
import { ConnectionEntity } from '../../../database/entities/connection.entity';

const RESTORE_TIMEOUT_MS = 300_000;

@Injectable()
export class MySQLRestoreStrategy implements RestoreStrategy {
  private readonly logger = new Logger(MySQLRestoreStrategy.name);

  async execute(
    connection: ConnectionEntity,
    filePath: string,
    onLog: (message: string) => void,
  ): Promise<void> {
    await this.truncateAllTables(connection, onLog);
    await this.runMysqlRestore(connection, filePath, onLog);
  }

  private async truncateAllTables(
    connection: ConnectionEntity,
    onLog: (message: string) => void,
  ): Promise<void> {
    const tables = await this.getTableNames(connection);
    onLog(`Found ${tables.length} tables to truncate`);

    if (tables.length === 0) {
      return;
    }

    const truncateSql = [
      'SET FOREIGN_KEY_CHECKS = 0;',
      ...tables.map((t) => `TRUNCATE TABLE \`${t.replace(/`/g, '``')}\`;`),
      'SET FOREIGN_KEY_CHECKS = 1;',
    ].join('\n');

    await this.executeSql(connection, truncateSql);
    onLog('All tables truncated successfully');
  }

  private getTableNames(connection: ConnectionEntity): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const settle = (fn: typeof resolve | typeof reject, value: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        (fn as (v: unknown) => void)(value);
      };

      const args = [
        '-h',
        connection.host,
        '-P',
        String(connection.port),
        '-u',
        connection.username,
        '-N',
        '-B',
        '-e',
        'SHOW TABLES',
        connection.database,
      ];

      // MYSQL_PWD keeps the password out of argv (not visible in ps aux / /proc).
      const child = spawn('mysql', args, {
        env: { ...process.env, MYSQL_PWD: connection.password },
      });

      const timeout = setTimeout(() => {
        child.kill();
        settle(reject, new Error(`mysql SHOW TABLES exceeded ${RESTORE_TIMEOUT_MS}ms timeout`));
      }, RESTORE_TIMEOUT_MS);

      let stdout = '';

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk: Buffer) => {
        this.logger.warn(`mysql SHOW TABLES stderr: ${chunk.toString().trim()}`);
      });

      child.on('error', (error: Error) => {
        settle(reject, new Error(`mysql SHOW TABLES failed to start: ${error.message}`));
      });

      child.on('close', (code: number | null) => {
        if (code !== 0) {
          settle(reject, new Error(`mysql SHOW TABLES exited with code ${code ?? 'unknown'}`));
          return;
        }

        const tables = stdout
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        settle(resolve, tables);
      });
    });
  }

  private executeSql(
    connection: ConnectionEntity,
    sql: string,
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
        '-P',
        String(connection.port),
        '-u',
        connection.username,
        connection.database,
        '-e',
        sql,
      ];

      // MYSQL_PWD keeps the password out of argv (not visible in ps aux / /proc).
      const child = spawn('mysql', args, {
        env: { ...process.env, MYSQL_PWD: connection.password },
      });

      const timeout = setTimeout(() => {
        child.kill();
        settle(reject, new Error(`mysql execute exceeded ${RESTORE_TIMEOUT_MS}ms timeout`));
      }, RESTORE_TIMEOUT_MS);

      let stderr = '';

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on('error', (error: Error) => {
        settle(reject, new Error(`mysql execute failed to start: ${error.message}`));
      });

      child.on('close', (code: number | null) => {
        if (code !== 0) {
          settle(
            reject,
            new Error(`mysql execute exited with code ${code ?? 'unknown'}: ${stderr.trim()}`),
          );
          return;
        }
        settle(resolve);
      });
    });
  }

  private runMysqlRestore(
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
        '-P',
        String(connection.port),
        '-u',
        connection.username,
        connection.database,
        '-e',
        `source ${filePath}`,
      ];

      // MYSQL_PWD keeps the password out of argv (not visible in ps aux / /proc).
      const mysqlChild = spawn('mysql', args, {
        env: { ...process.env, MYSQL_PWD: connection.password },
      });

      const timeout = setTimeout(() => {
        mysqlChild.kill();
        settle(reject, new Error(`mysql restore exceeded ${RESTORE_TIMEOUT_MS}ms timeout`));
      }, RESTORE_TIMEOUT_MS);

      mysqlChild.stderr.on('data', (chunk: Buffer) => {
        const lines = chunk
          .toString()
          .split('\n')
          .filter((line) => line.trim().length > 0);

        for (const line of lines) {
          onLog(line);
        }
      });

      mysqlChild.on('error', (error: Error) => {
        settle(reject, new Error(`mysql restore failed to start: ${error.message}`));
      });

      mysqlChild.on('close', (code: number | null) => {
        if (code === 0) {
          settle(resolve);
        } else {
          settle(reject, new Error(`mysql restore exited with code ${code ?? 'unknown'}`));
        }
      });
    });
  }
}
