import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Environment } from '../enums/environment.enum';

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

  @Column({ type: 'enum', enum: Environment })
  environment!: Environment;

  @CreateDateColumn()
  createdAt!: Date;
}
