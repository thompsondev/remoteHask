import { SystemRole } from '../enums';

export interface PermissionDefinition {
  id: string;
  description: string;
  category: string;
}

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  { id: 'organization.read', description: 'View organization settings', category: 'organization' },
  {
    id: 'organization.update',
    description: 'Update organization settings',
    category: 'organization',
  },
  { id: 'member.read', description: 'View organization members', category: 'user' },
  { id: 'member.invite', description: 'Invite organization members', category: 'user' },
  { id: 'member.update', description: 'Update member roles', category: 'user' },
  { id: 'device.read', description: 'View devices', category: 'device' },
  { id: 'device.manage', description: 'Register and update devices', category: 'device' },
  { id: 'device.delete', description: 'Decommission devices', category: 'device' },
  { id: 'session.create', description: 'Start remote sessions', category: 'session' },
  { id: 'session.read', description: 'View session history', category: 'session' },
  { id: 'session.terminate', description: 'Terminate active sessions', category: 'session' },
  { id: 'policy.read', description: 'View policies', category: 'policy' },
  { id: 'policy.manage', description: 'Create and update policies', category: 'policy' },
  { id: 'audit.read', description: 'View audit logs', category: 'security' },
  { id: 'file_transfer.use', description: 'Transfer files during sessions', category: 'session' },
];

export const ROLE_PERMISSION_MAP: Record<SystemRole, string[]> = {
  [SystemRole.OWNER]: PERMISSION_CATALOG.map((p) => p.id),
  [SystemRole.ADMIN]: PERMISSION_CATALOG.map((p) => p.id),
  [SystemRole.MSP_ADMIN]: PERMISSION_CATALOG.map((p) => p.id),
  [SystemRole.DEVICE_MANAGER]: [
    'organization.read',
    'member.read',
    'device.read',
    'device.manage',
    'device.delete',
    'session.read',
    'policy.read',
    'audit.read',
  ],
  [SystemRole.TECHNICIAN]: [
    'organization.read',
    'device.read',
    'session.create',
    'session.read',
    'session.terminate',
    'file_transfer.use',
  ],
  [SystemRole.VIEWER]: ['organization.read', 'device.read', 'session.read', 'audit.read'],
  [SystemRole.AUDITOR]: [
    'organization.read',
    'device.read',
    'session.read',
    'policy.read',
    'audit.read',
  ],
};
