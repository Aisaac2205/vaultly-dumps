import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Global retention policy for MANUAL dumps (which have no cronjob). Singleton:
 * always a single row with id = 1, applied by the daily sweeper.
 */
@Entity('manual_retention_settings')
export class ManualRetentionSettingEntity {
  @PrimaryColumn({ type: 'int', default: 1 })
  id!: number;

  @Column({ default: false })
  enabled!: boolean;

  @Column({ type: 'integer', nullable: true })
  keepLast!: number | null;

  @Column({ type: 'integer', nullable: true })
  maxAgeDays!: number | null;

  @Column({ type: 'integer', nullable: true })
  maxTotalSizeMb!: number | null;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSweepAt!: Date | null;
}
