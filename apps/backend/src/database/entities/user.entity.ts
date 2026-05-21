import { Column, Entity, Index, OneToMany } from 'typeorm';

import { SoftDeleteEntity } from '../common/soft-delete.entity';

import { AuditEvent } from './audit-event.entity';
import { OrganizationMember } from './organization-member.entity';
import { RefreshToken } from './refresh-token.entity';
import { RemoteSession } from './remote-session.entity';

@Entity('users')
@Index('uq_users_email_active', ['email'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class User extends SoftDeleteEntity {
  @Column({ type: 'citext' })
  email!: string;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'display_name', type: 'varchar', length: 255 })
  displayName!: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl!: string | null;

  @Column({ name: 'is_platform_admin', type: 'boolean', default: false })
  isPlatformAdmin!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @OneToMany(() => OrganizationMember, (member) => member.user)
  organizationMemberships!: OrganizationMember[];

  @OneToMany(() => RemoteSession, (session) => session.initiatedByUser)
  initiatedSessions!: RemoteSession[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  @OneToMany(() => AuditEvent, (event) => event.actorUser)
  auditEventsAsActor!: AuditEvent[];
}
