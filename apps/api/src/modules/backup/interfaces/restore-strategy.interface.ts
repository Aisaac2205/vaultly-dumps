import { ConnectionEntity } from '../../../database/entities/connection.entity';

export interface RestoreStrategy {
  execute(
    connection: ConnectionEntity,
    filePath: string,
    onLog: (message: string) => void,
  ): Promise<void>;
}
