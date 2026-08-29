import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Environment } from '../enums/environment.enum';
import type {
  AuditOutcome,
  AuditSeverity,
} from '../../auth/audit/auth-audit-event';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  action!: string;

  @Column()
  userId!: string;

  @Column()
  username!: string;

  @Column()
  resourceType!: string;

  @Column()
  resourceId!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  // Null for authentication events: the enum describes the environment of an
  // audited ERP connection, and a sign-in belongs to none of them.
  @Column({ type: 'enum', enum: Environment, nullable: true })
  environment!: Environment | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', default: 'success' })
  outcome!: AuditOutcome;

  @Column({ type: 'varchar', default: 'low' })
  severity!: AuditSeverity;

  @CreateDateColumn()
  createdAt!: Date;
}
