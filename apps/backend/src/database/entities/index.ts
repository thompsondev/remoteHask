import { AuditEvent } from './audit-event.entity';
import { DeviceCredential } from './device-credential.entity';
import { DeviceTag } from './device-tag.entity';
import { Device } from './device.entity';
import { EnrollmentToken } from './enrollment-token.entity';
import { FileTransfer } from './file-transfer.entity';
import { OrganizationMember } from './organization-member.entity';
import { OrganizationPolicy } from './organization-policy.entity';
import { OrganizationSettings } from './organization-settings.entity';
import { Organization } from './organization.entity';
import { Permission } from './permission.entity';
import { RefreshToken } from './refresh-token.entity';
import { RemoteSessionEvent } from './remote-session-event.entity';
import { RemoteSessionParticipant } from './remote-session-participant.entity';
import { RemoteSession } from './remote-session.entity';
import { RolePermission } from './role-permission.entity';
import { User } from './user.entity';

export const entities = [
  Organization,
  OrganizationSettings,
  User,
  OrganizationMember,
  Permission,
  RolePermission,
  Device,
  DeviceCredential,
  DeviceTag,
  EnrollmentToken,
  OrganizationPolicy,
  RemoteSession,
  RemoteSessionEvent,
  RemoteSessionParticipant,
  FileTransfer,
  AuditEvent,
  RefreshToken,
] as const;

export {
  AuditEvent,
  Device,
  DeviceCredential,
  DeviceTag,
  EnrollmentToken,
  FileTransfer,
  Organization,
  OrganizationMember,
  OrganizationPolicy,
  OrganizationSettings,
  Permission,
  RefreshToken,
  RemoteSession,
  RemoteSessionEvent,
  RemoteSessionParticipant,
  RolePermission,
  User,
};
