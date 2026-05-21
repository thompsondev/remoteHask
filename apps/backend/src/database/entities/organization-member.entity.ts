import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { SoftDeleteEntity } from '../common/soft-delete.entity';
import { OrganizationMemberStatus, SystemRole } from '../enums';

import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('organization_members')
@Index('uq_org_member_active', ['organizationId', 'userId'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index('idx_org_members_org', ['organizationId'], { where: '"deleted_at" IS NULL' })
@Index('idx_org_members_user', ['userId'], { where: '"deleted_at" IS NULL' })
export class OrganizationMember extends SoftDeleteEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, (org) => org.members, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.organizationMemberships, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    type: 'enum',
    enum: SystemRole,
    enumName: 'system_role',
  })
  role!: SystemRole;

  @Column({
    type: 'enum',
    enum: OrganizationMemberStatus,
    enumName: 'organization_member_status',
    default: OrganizationMemberStatus.ACTIVE,
  })
  status!: OrganizationMemberStatus;

  @Column({ name: 'custom_permissions', type: 'jsonb', nullable: true })
  customPermissions!: string[] | null;

  @Column({ name: 'last_active_at', type: 'timestamptz', nullable: true })
  lastActiveAt!: Date | null;
}
