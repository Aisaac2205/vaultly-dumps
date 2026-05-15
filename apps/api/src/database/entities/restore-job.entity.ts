import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Environment } from '../enums/environment.enum';
import { JobStatus } from '../enums/job-status.enum';

@Entity('restore_jobs')
export class RestoreJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', nullable: true })
  sourceBackupId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  r2Key!: string | null;

  @Column()
  targetConnectionId!: string;

  @Column({ type: 'enum', enum: Environment })
  targetEnvironment!: Environment;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.PENDING })
  status!: JobStatus;

  @Column({ default: false })
  isDryRun!: boolean;

  @Column()
  startedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column()
  triggeredBy!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
