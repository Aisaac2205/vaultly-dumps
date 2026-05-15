import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Environment } from '../enums/environment.enum';
import { DbTypeEnum } from '../enums/db-type.enum';
import { JobStatus } from '../enums/job-status.enum';
import { BackupCategory } from '../enums/backup-category.enum';

export const STORAGE_KEY_VERSION = {
  LEGACY: 1,
  NEW: 2,
} as const;
export type StorageKeyVersion =
  (typeof STORAGE_KEY_VERSION)[keyof typeof STORAGE_KEY_VERSION];

@Entity('backup_jobs')
export class BackupJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  connectionId!: string;

  @Column({ type: 'enum', enum: Environment })
  environment!: Environment;

  @Column({ type: 'enum', enum: DbTypeEnum, nullable: true })
  dbType!: DbTypeEnum | null;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.PENDING })
  status!: JobStatus;

  @Column({ type: 'varchar', nullable: true })
  fileKey!: string | null;

  @Column({ type: 'integer', default: STORAGE_KEY_VERSION.LEGACY })
  storageKeyVersion!: StorageKeyVersion;

  @Column({ type: 'enum', enum: BackupCategory, nullable: true })
  category!: BackupCategory | null;

  @Column({ type: 'float', nullable: true })
  fileSizeMb!: number | null;

  @Column({ type: 'timestamp', nullable: true })
  startedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column()
  triggeredBy!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
