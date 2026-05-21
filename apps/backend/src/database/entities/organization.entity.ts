import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';

import { SoftDeleteEntity } from '../common/soft-delete.entity';
import { OrganizationStatus, SubscriptionTier } from '../enums';

import { AuditEvent } from './audit-event.entity';
import { Device } from './device.entity';
import { OrganizationMember } from './organization-member.entity';
import { OrganizationPolicy } from './organization-policy.entity';
import { OrganizationSettings } from './organization-settings.entity';
import { RemoteSession } from './remote-session.entity';

@Entity('organizations')
@Index('uq_org_slug_active', ['parentOrganizationId', 'slug'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class Organization extends SoftDeleteEntity {
  @Column({ name: 'parent_organization_id', type: 'uuid', nullable: true })
  parentOrganizationId!: string | null;

  @ManyToOne(() => Organization, (org) => org.childOrganizations, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'parent_organization_id' })
  parentOrganization!: Organization | null;

  @OneToMany(() => Organization, (org) => org.parentOrganization)
  childOrganizations!: Organization[];

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 63 })
  slug!: string;

  @Column({
    type: 'enum',
    enum: OrganizationStatus,
    enumName: 'organization_status',
    default: OrganizationStatus.TRIAL,
  })
  status!: OrganizationStatus;

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    enumName: 'subscription_tier',
    default: SubscriptionTier.STARTER,
  })
  tier!: SubscriptionTier;

  @Column({ name: 'data_region', type: 'varchar', length: 16, default: 'us-east' })
  dataRegion!: string;

  @Column({ type: 'jsonb', default: {} })
  settings!: Record<string, unknown>;

  @OneToOne(() => OrganizationSettings, (settings) => settings.organization)
  organizationSettings!: OrganizationSettings;

  @OneToMany(() => OrganizationMember, (member) => member.organization)
  members!: OrganizationMember[];

  @OneToMany(() => Device, (device) => device.organization)
  devices!: Device[];

  @OneToMany(() => OrganizationPolicy, (policy) => policy.organization)
  policies!: OrganizationPolicy[];

  @OneToMany(() => RemoteSession, (session) => session.organization)
  remoteSessions!: RemoteSession[];

  @OneToMany(() => AuditEvent, (event) => event.organization)
  auditEvents!: AuditEvent[];
}
