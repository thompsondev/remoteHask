import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/base.entity';
import { SessionEndReason, SessionStatus, SessionType } from '../enums';

import { AuditEvent } from './audit-event.entity';
import { Device } from './device.entity';
import { FileTransfer } from './file-transfer.entity';
import { Organization } from './organization.entity';
import { RemoteSessionEvent } from './remote-session-event.entity';
import { RemoteSessionParticipant } from './remote-session-participant.entity';
import { User } from './user.entity';

@Entity('remote_sessions')
@Index('idx_remote_sessions_org_requested', ['organizationId', 'requestedAt'])
@Index('uq_remote_sessions_device_active', ['deviceId'], {
  unique: true,
  where: `"status" IN ('pending_agent', 'negotiating', 'active')`,
})
@Index('idx_remote_sessions_initiator', ['initiatedByUserId', 'requestedAt'])
export class RemoteSession extends BaseEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, (org) => org.remoteSessions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId!: string;

  @ManyToOne(() => Device, (device) => device.remoteSessions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'device_id' })
  device!: Device;

  @Column({ name: 'initiated_by_user_id', type: 'uuid' })
  initiatedByUserId!: string;

  @ManyToOne(() => User, (user) => user.initiatedSessions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'initiated_by_user_id' })
  initiatedByUser!: User;

  @Column({
    type: 'enum',
    enum: SessionType,
    enumName: 'session_type',
  })
  type!: SessionType;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    enumName: 'session_status',
    default: SessionStatus.REQUESTED,
  })
  status!: SessionStatus;

  @Column({
    name: 'end_reason',
    type: 'enum',
    enum: SessionEndReason,
    enumName: 'session_end_reason',
    nullable: true,
  })
  endReason!: SessionEndReason | null;

  @Column({ name: 'policy_snapshot', type: 'jsonb', nullable: true })
  policySnapshot!: Record<string, unknown> | null;

  @Column({ name: 'mfa_verified_at', type: 'timestamptz', nullable: true })
  mfaVerifiedAt!: Date | null;

  @Column({ name: 'client_ip', type: 'inet', nullable: true })
  clientIp!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ name: 'webrtc_transport', type: 'varchar', length: 16, nullable: true })
  webrtcTransport!: string | null;

  @Column({ name: 'turn_allocation_id', type: 'varchar', length: 64, nullable: true })
  turnAllocationId!: string | null;

  @Column({ name: 'bytes_sent', type: 'bigint', nullable: true })
  bytesSent!: string | null;

  @Column({ name: 'bytes_received', type: 'bigint', nullable: true })
  bytesReceived!: string | null;

  @Column({ name: 'requested_at', type: 'timestamptz', default: () => 'NOW()' })
  requestedAt!: Date;

  @Column({ name: 'agent_accepted_at', type: 'timestamptz', nullable: true })
  agentAcceptedAt!: Date | null;

  @Column({ name: 'connected_at', type: 'timestamptz', nullable: true })
  connectedAt!: Date | null;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt!: Date | null;

  @Column({ name: 'error_code', type: 'varchar', length: 64, nullable: true })
  errorCode!: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'trace_id', type: 'varchar', length: 32, nullable: true })
  traceId!: string | null;

  @OneToMany(() => RemoteSessionEvent, (event) => event.remoteSession)
  events!: RemoteSessionEvent[];

  @OneToMany(() => RemoteSessionParticipant, (participant) => participant.remoteSession)
  participants!: RemoteSessionParticipant[];

  @OneToMany(() => FileTransfer, (transfer) => transfer.remoteSession)
  fileTransfers!: FileTransfer[];

  @OneToMany(() => AuditEvent, (event) => event.remoteSession)
  auditEvents!: AuditEvent[];
}
