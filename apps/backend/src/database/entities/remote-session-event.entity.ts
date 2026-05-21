import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { AuditActorType, SessionEventType } from '../enums';

import { Organization } from './organization.entity';
import { RemoteSession } from './remote-session.entity';
import { User } from './user.entity';

@Entity('remote_session_events')
@Index('idx_remote_session_events_session', ['remoteSessionId', 'occurredAt'])
export class RemoteSessionEvent {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ name: 'remote_session_id', type: 'uuid' })
  remoteSessionId!: string;

  @ManyToOne(() => RemoteSession, (session) => session.events, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'remote_session_id' })
  remoteSession!: RemoteSession;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: SessionEventType,
    enumName: 'session_event_type',
  })
  eventType!: SessionEventType;

  @PrimaryColumn({ name: 'occurred_at', type: 'timestamptz', default: () => 'NOW()' })
  occurredAt!: Date;

  @Column({
    name: 'actor_type',
    type: 'enum',
    enum: AuditActorType,
    enumName: 'audit_actor_type',
    nullable: true,
  })
  actorType!: AuditActorType | null;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser!: User | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  message!: string | null;
}
