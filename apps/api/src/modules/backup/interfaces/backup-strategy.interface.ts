import { ConnectionEntity } from '../../../database/entities/connection.entity';

export interface BackupStrategy {
  execute(
    connection: ConnectionEntity,
    fileKey: string,
    metadata?: Record<string, string>,
  ): Promise<number>;
}
