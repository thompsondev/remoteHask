import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { AuditActorType, AuditCategory, AuditSeverity } from '../enums';

import { Device } from './device.entity';
import { Organization } from './organization.entity';
import { RemoteSession } from './remote-session.entity';
import { User } from './user.entity';

@Entity('audit_events')
@Index('idx_audit_events_org_created', ['organizationId', 'createdAt'])
@Index('idx_audit_events_org_category', ['organizationId', 'category', 'createdAt'])
export class AuditEvent {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId!: string | null;

  @ManyToOne(() => Organization, (org) => org.auditEvents, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization | null;

  @Column({
    type: 'enum',
    enum: AuditCategory,
    enumName: 'audit_category',
  })
  category!: AuditCategory;

  @Column({ type: 'varchar', length: 128 })
  action!: string;

  @Column({
    type: 'enum',
    enum: AuditSeverity,
    enumName: 'audit_severity',
    default: AuditSeverity.INFO,
  })
  severity!: AuditSeverity;

  @Column({
    name: 'actor_type',
    type: 'enum',
    enum: AuditActorType,
    enumName: 'audit_actor_type',
  })
  actorType!: AuditActorType;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId!: string | null;

  @ManyToOne(() => User, (user) => user.auditEventsAsActor, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser!: User | null;

  @Column({ name: 'actor_device_id', type: 'uuid', nullable: true })
  actorDeviceId!: string | null;

  @ManyToOne(() => Device, (device) => device.auditEventsAsActor, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'actor_device_id' })
  actorDevice!: Device | null;

  @Column({ name: 'actor_api_key_id', type: 'uuid', nullable: true })
  actorApiKeyId!: string | null;

  @Column({ name: 'target_type', type: 'varchar', length: 64, nullable: true })
  targetType!: string | null;

  @Column({ name: 'target_id', type: 'uuid', nullable: true })
  targetId!: string | null;

  @Column({ name: 'remote_session_id', type: 'uuid', nullable: true })
  remoteSessionId!: string | null;

  @ManyToOne(() => RemoteSession, (session) => session.auditEvents, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'remote_session_id' })
  remoteSession!: RemoteSession | null;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'jsonb', default: {} })
  payload!: Record<string, unknown>;

  @Column({ name: 'trace_id', type: 'varchar', length: 32, nullable: true })
  traceId!: string | null;

  @PrimaryColumn({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;
}
