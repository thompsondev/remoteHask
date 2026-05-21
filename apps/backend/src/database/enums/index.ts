/** PostgreSQL enum mirrors — see DATABASE_SCHEMA.md §3 */

export enum OrganizationStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  CHURNED = 'churned',
}

export enum SubscriptionTier {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  MSP = 'msp',
}

export enum OrganizationMemberStatus {
  ACTIVE = 'active',
  INVITED = 'invited',
  SUSPENDED = 'suspended',
  REMOVED = 'removed',
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export enum SystemRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  DEVICE_MANAGER = 'device_manager',
  TECHNICIAN = 'technician',
  VIEWER = 'viewer',
  AUDITOR = 'auditor',
  MSP_ADMIN = 'msp_admin',
}

export enum DevicePlatform {
  WINDOWS = 'windows',
  MACOS = 'macos',
  LINUX = 'linux',
  OTHER = 'other',
}

export enum DeviceRegistrationStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REVOKED = 'revoked',
  DECOMMISSIONED = 'decommissioned',
}

export enum PresenceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  STALE = 'stale',
  UNKNOWN = 'unknown',
}

export enum SessionStatus {
  REQUESTED = 'requested',
  POLICY_DENIED = 'policy_denied',
  PENDING_AGENT = 'pending_agent',
  NEGOTIATING = 'negotiating',
  ACTIVE = 'active',
  ENDED = 'ended',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum SessionType {
  ATTENDED = 'attended',
  UNATTENDED = 'unattended',
}

export enum SessionEndReason {
  USER_DISCONNECT = 'user_disconnect',
  TECHNICIAN_DISCONNECT = 'technician_disconnect',
  AGENT_REJECT = 'agent_reject',
  POLICY_REVOKED = 'policy_revoked',
  TIMEOUT = 'timeout',
  NETWORK_ERROR = 'network_error',
  ADMIN_TERMINATE = 'admin_terminate',
  ERROR = 'error',
}

export enum SessionEventType {
  REQUESTED = 'requested',
  POLICY_EVALUATED = 'policy_evaluated',
  MFA_COMPLETED = 'mfa_completed',
  INVITE_SENT = 'invite_sent',
  AGENT_ACCEPTED = 'agent_accepted',
  AGENT_REJECTED = 'agent_rejected',
  SIGNALING_STARTED = 'signaling_started',
  WEBRTC_CONNECTED = 'webrtc_connected',
  WEBRTC_FAILED = 'webrtc_failed',
  FILE_TRANSFER_STARTED = 'file_transfer_started',
  FILE_TRANSFER_COMPLETED = 'file_transfer_completed',
  RECORDING_STARTED = 'recording_started',
  RECORDING_STOPPED = 'recording_stopped',
  TERMINATED = 'terminated',
  ERROR = 'error',
}

export enum FileTransferDirection {
  UPLOAD_TO_DEVICE = 'upload_to_device',
  DOWNLOAD_FROM_DEVICE = 'download_from_device',
}

export enum FileTransferStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked',
}

export enum AuditActorType {
  USER = 'user',
  DEVICE = 'device',
  SYSTEM = 'system',
  API_KEY = 'api_key',
  SUPPORT = 'support',
}

export enum AuditCategory {
  ORGANIZATION = 'organization',
  USER = 'user',
  DEVICE = 'device',
  POLICY = 'policy',
  SESSION = 'session',
  INTEGRATION = 'integration',
  SECURITY = 'security',
  BILLING = 'billing',
  AGENT = 'agent',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}
