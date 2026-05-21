import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { SoftDeleteEntity } from '../common/soft-delete.entity';
import { DevicePlatform, DeviceRegistrationStatus, PresenceStatus } from '../enums';

import { AuditEvent } from './audit-event.entity';
import { DeviceCredential } from './device-credential.entity';
import { DeviceTag } from './device-tag.entity';
import { Organization } from './organization.entity';
import { RemoteSession } from './remote-session.entity';

@Entity('devices')
@Index('idx_devices_org_last_seen', ['organizationId', 'lastSeenAt'], {
  where: '"deleted_at" IS NULL',
})
export class Device extends SoftDeleteEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, (org) => org.devices, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ type: 'varchar', length: 255 })
  hostname!: string;

  @Column({ name: 'friendly_name', type: 'varchar', length: 255, nullable: true })
  friendlyName!: string | null;

  @Column({
    type: 'enum',
    enum: DevicePlatform,
    enumName: 'device_platform',
  })
  platform!: DevicePlatform;

  @Column({ name: 'os_version', type: 'varchar', length: 64, nullable: true })
  osVersion!: string | null;

  @Column({ name: 'agent_version', type: 'varchar', length: 32, nullable: true })
  agentVersion!: string | null;

  @Column({
    name: 'registration_status',
    type: 'enum',
    enum: DeviceRegistrationStatus,
    enumName: 'device_registration_status',
    default: DeviceRegistrationStatus.PENDING,
  })
  registrationStatus!: DeviceRegistrationStatus;

  @Column({
    name: 'last_known_presence',
    type: 'enum',
    enum: PresenceStatus,
    enumName: 'presence_status',
    default: PresenceStatus.UNKNOWN,
  })
  lastKnownPresence!: PresenceStatus;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt!: Date | null;

  @Column({ name: 'last_seen_ip', type: 'inet', nullable: true })
  lastSeenIp!: string | null;

  @Column({ name: 'last_console_user', type: 'varchar', length: 255, nullable: true })
  lastConsoleUser!: string | null;

  @Column({ name: 'hardware_info', type: 'jsonb', nullable: true })
  hardwareInfo!: Record<string, unknown> | null;

  @Column({ name: 'unattended_enabled', type: 'boolean', nullable: true })
  unattendedEnabled!: boolean | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'registered_at', type: 'timestamptz', nullable: true })
  registeredAt!: Date | null;

  @OneToMany(() => DeviceCredential, (credential) => credential.device)
  credentials!: DeviceCredential[];

  @OneToMany(() => DeviceTag, (tag) => tag.device)
  tags!: DeviceTag[];

  @OneToMany(() => RemoteSession, (session) => session.device)
  remoteSessions!: RemoteSession[];

  @OneToMany(() => AuditEvent, (event) => event.actorDevice)
  auditEventsAsActor!: AuditEvent[];
}
