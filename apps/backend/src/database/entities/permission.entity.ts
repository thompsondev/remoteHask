import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

import { RolePermission } from './role-permission.entity';

@Entity('permissions')
export class Permission {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 32 })
  category!: string;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions!: RolePermission[];
}
