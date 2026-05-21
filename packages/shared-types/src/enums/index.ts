/** API / domain enums — aligned with DATABASE_SCHEMA.md */

export const SessionStatus = {
  REQUESTED: 'requested',
  POLICY_DENIED: 'policy_denied',
  PENDING_AGENT: 'pending_agent',
  NEGOTIATING: 'negotiating',
  ACTIVE: 'active',
  ENDED: 'ended',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export const SessionType = {
  ATTENDED: 'attended',
  UNATTENDED: 'unattended',
} as const;

export type SessionType = (typeof SessionType)[keyof typeof SessionType];

export const PresenceStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  STALE: 'stale',
  UNKNOWN: 'unknown',
} as const;

export type PresenceStatus = (typeof PresenceStatus)[keyof typeof PresenceStatus];

export const DevicePlatform = {
  WINDOWS: 'windows',
  MACOS: 'macos',
  LINUX: 'linux',
  OTHER: 'other',
} as const;

export type DevicePlatform = (typeof DevicePlatform)[keyof typeof DevicePlatform];

export const SystemRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  DEVICE_MANAGER: 'device_manager',
  TECHNICIAN: 'technician',
  VIEWER: 'viewer',
  AUDITOR: 'auditor',
  MSP_ADMIN: 'msp_admin',
} as const;

export type SystemRole = (typeof SystemRole)[keyof typeof SystemRole];

export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  MFA_REQUIRED: 'MFA_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  ORG_ACCESS_DENIED: 'ORG_ACCESS_DENIED',
  NOT_FOUND: 'NOT_FOUND',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
  ENROLLMENT_TOKEN_EXPIRED: 'ENROLLMENT_TOKEN_EXPIRED',
  ENROLLMENT_TOKEN_INVALID: 'ENROLLMENT_TOKEN_INVALID',
  SESSION_ALREADY_ACTIVE: 'SESSION_ALREADY_ACTIVE',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  POLICY_DENIED: 'POLICY_DENIED',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
