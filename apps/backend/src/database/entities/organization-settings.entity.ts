import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Organization } from './organization.entity';

@Entity('organization_settings')
export class OrganizationSettings {
  @PrimaryColumn({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @OneToOne(() => Organization, (org) => org.organizationSettings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'unattended_enabled', type: 'boolean', default: false })
  unattendedEnabled!: boolean;

  @Column({ name: 'mfa_required', type: 'boolean', default: true })
  mfaRequired!: boolean;

  @Column({ name: 'session_recording_allowed', type: 'boolean', default: false })
  sessionRecordingAllowed!: boolean;

  @Column({ name: 'max_concurrent_sessions', type: 'int', default: 10 })
  maxConcurrentSessions!: number;

  @Column({ name: 'file_transfer_max_bytes', type: 'bigint', default: '5368709120' })
  fileTransferMaxBytes!: string;

  @Column({ name: 'ip_allowlist', type: 'inet', array: true, nullable: true })
  ipAllowlist!: string[] | null;

  @Column({ name: 'retention_audit_days', type: 'int', default: 90 })
  retentionAuditDays!: number;

  @Column({ name: 'retention_session_days', type: 'int', default: 90 })
  retentionSessionDays!: number;

  @Column({ name: 'e2ee_required', type: 'boolean', default: false })
  e2eeRequired!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
