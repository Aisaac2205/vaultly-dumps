import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JobStatus } from '../enums/job-status.enum';
import { CronFrequency } from '../enums/cron-frequency.enum';

@Entity('cronjobs')
export class CronjobEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  connectionId!: string;

  @Column()
  cronExpression!: string;

  @Column({ type: 'enum', enum: CronFrequency })
  frequency!: CronFrequency;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastRunAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  nextRunAt!: Date | null;

  @Column({ type: 'enum', enum: JobStatus, nullable: true })
  lastStatus!: JobStatus | null;

  // --- Retention policy: prune this connection+category after each run ---
  @Column({ default: false })
  retentionEnabled!: boolean;

  @Column({ type: 'integer', nullable: true })
  retentionKeepLast!: number | null;

  @Column({ type: 'integer', nullable: true })
  retentionMaxAgeDays!: number | null;

  @Column({ type: 'integer', nullable: true })
  retentionMaxSizeMb!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
