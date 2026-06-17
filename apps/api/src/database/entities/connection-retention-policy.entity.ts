import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BackupCategory } from '../enums/backup-category.enum';

/**
 * Per-connection, per-category retention policy.
 *
 * A row exists for every (connectionId, category) pair the user has configured.
 * - retentionDays == null → keep forever (no pruning).
 * - retentionDays >= 1   → prune dumps older than N days.
 *
 * The daily sweeper and cronjobs read from this table instead of the legacy
 * cronjobs.retention* columns or manual_retention_settings.
 */
@Entity('connection_retention_policies')
export class ConnectionRetentionPolicyEntity {
  @PrimaryColumn()
  connectionId!: string;

  @PrimaryColumn({ type: 'enum', enum: BackupCategory })
  category!: BackupCategory;

  /**
   * Number of days to retain dumps for this connection+category.
   * null = keep forever.
   */
  @Column({ type: 'integer', nullable: true })
  retentionDays!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
