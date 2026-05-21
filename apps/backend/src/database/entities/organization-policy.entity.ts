import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { SoftDeleteEntity } from '../common/soft-delete.entity';

import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('organization_policies')
@Index('idx_org_policies_org_active', ['organizationId'], {
  where: '"deleted_at" IS NULL AND is_active = true',
})
export class OrganizationPolicy extends SoftDeleteEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, (org) => org.policies, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb' })
  rules!: Record<string, unknown>;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser!: User | null;
}
