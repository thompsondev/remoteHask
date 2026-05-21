import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { SystemRole } from '../enums';

import { Permission } from './permission.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn({
    type: 'enum',
    enum: SystemRole,
    enumName: 'system_role',
  })
  role!: SystemRole;

  @PrimaryColumn({ name: 'permission_id', type: 'varchar', length: 64 })
  permissionId!: string;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id' })
  permission!: Permission;
}
