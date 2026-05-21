import * as bcrypt from 'bcrypt';
import type { DataSource } from 'typeorm';

import { AuditEvent } from '../entities/audit-event.entity';
import { Device } from '../entities/device.entity';
import { OrganizationMember } from '../entities/organization-member.entity';
import { OrganizationSettings } from '../entities/organization-settings.entity';
import { Organization } from '../entities/organization.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { User } from '../entities/user.entity';
import {
  AuditActorType,
  AuditCategory,
  AuditSeverity,
  DevicePlatform,
  DeviceRegistrationStatus,
  OrganizationMemberStatus,
  OrganizationStatus,
  PresenceStatus,
  SubscriptionTier,
  SystemRole,
} from '../enums';

import { PERMISSION_CATALOG, ROLE_PERMISSION_MAP } from './permissions.catalog';

const DEMO_ORG_SLUG = 'demo';
const DEMO_ADMIN_EMAIL = 'admin@demo.remotehask.local';
const DEMO_ADMIN_PASSWORD = 'ChangeMe!123';

export async function runInitialSeed(dataSource: DataSource): Promise<void> {
  const permissionRepo = dataSource.getRepository(Permission);
  const rolePermissionRepo = dataSource.getRepository(RolePermission);
  const orgRepo = dataSource.getRepository(Organization);
  const settingsRepo = dataSource.getRepository(OrganizationSettings);
  const userRepo = dataSource.getRepository(User);
  const memberRepo = dataSource.getRepository(OrganizationMember);
  const deviceRepo = dataSource.getRepository(Device);
  const auditRepo = dataSource.getRepository(AuditEvent);

  await permissionRepo.upsert(
    PERMISSION_CATALOG.map((permission) => ({
      id: permission.id,
      description: permission.description,
      category: permission.category,
    })),
    ['id'],
  );

  const rolePermissionRows = Object.entries(ROLE_PERMISSION_MAP).flatMap(([role, permissionIds]) =>
    permissionIds.map((permissionId) => ({
      role: role as SystemRole,
      permissionId,
    })),
  );

  await rolePermissionRepo.upsert(rolePermissionRows, ['role', 'permissionId']);

  let organization = await orgRepo.findOne({ where: { slug: DEMO_ORG_SLUG } });

  if (!organization) {
    organization = await orgRepo.save(
      orgRepo.create({
        name: 'Demo Organization',
        slug: DEMO_ORG_SLUG,
        status: OrganizationStatus.ACTIVE,
        tier: SubscriptionTier.STARTER,
        settings: { features: { remoteSessions: true } },
      }),
    );

    await settingsRepo.save(
      settingsRepo.create({
        organizationId: organization.id,
      }),
    );
  }

  let adminUser = await userRepo.findOne({ where: { email: DEMO_ADMIN_EMAIL } });

  if (!adminUser) {
    const passwordHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 12);

    adminUser = await userRepo.save(
      userRepo.create({
        email: DEMO_ADMIN_EMAIL,
        emailVerifiedAt: new Date(),
        passwordHash,
        displayName: 'Demo Admin',
        isPlatformAdmin: false,
      }),
    );
  }

  const existingMember = await memberRepo.findOne({
    where: { organizationId: organization.id, userId: adminUser.id },
  });

  if (!existingMember) {
    await memberRepo.save(
      memberRepo.create({
        organizationId: organization.id,
        userId: adminUser.id,
        role: SystemRole.OWNER,
        status: OrganizationMemberStatus.ACTIVE,
      }),
    );
  }

  const deviceCount = await deviceRepo.count({ where: { organizationId: organization.id } });

  if (deviceCount === 0) {
    await deviceRepo.save([
      deviceRepo.create({
        organizationId: organization.id,
        hostname: 'workstation-01.demo',
        friendlyName: 'Workstation 01',
        platform: DevicePlatform.WINDOWS,
        osVersion: 'Windows 11',
        agentVersion: '0.1.0',
        registrationStatus: DeviceRegistrationStatus.ACTIVE,
        lastKnownPresence: PresenceStatus.OFFLINE,
        registeredAt: new Date(),
      }),
      deviceRepo.create({
        organizationId: organization.id,
        hostname: 'macbook-01.demo',
        friendlyName: 'MacBook 01',
        platform: DevicePlatform.MACOS,
        osVersion: 'macOS 15',
        agentVersion: '0.1.0',
        registrationStatus: DeviceRegistrationStatus.ACTIVE,
        lastKnownPresence: PresenceStatus.UNKNOWN,
        registeredAt: new Date(),
      }),
    ]);
  }

  const now = new Date();
  await auditRepo.save(
    auditRepo.create({
      organizationId: organization.id,
      category: AuditCategory.ORGANIZATION,
      action: 'seed.completed',
      severity: AuditSeverity.INFO,
      actorType: AuditActorType.SYSTEM,
      actorUserId: adminUser.id,
      payload: {
        message: 'Initial development seed applied',
        demoAdminEmail: DEMO_ADMIN_EMAIL,
      },
      createdAt: now,
    }),
  );

  console.warn('Seed complete:', {
    organizationId: organization.id,
    adminEmail: DEMO_ADMIN_EMAIL,
    adminPassword: DEMO_ADMIN_PASSWORD,
  });
}
