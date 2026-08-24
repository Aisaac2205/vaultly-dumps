import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('restore_leases')
export class RestoreLeaseEntity {
  @PrimaryColumn({ type: 'uuid' })
  targetConnectionId!: string;

  @Column({ type: 'uuid', unique: true })
  restoreJobId!: string;

  @Column({ type: 'uuid' })
  leaseToken!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
