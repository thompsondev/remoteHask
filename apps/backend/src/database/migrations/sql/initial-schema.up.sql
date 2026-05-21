-- M001: extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- M002: enums
CREATE TYPE organization_status AS ENUM ('active', 'suspended', 'trial', 'churned');
CREATE TYPE subscription_tier AS ENUM ('starter', 'professional', 'enterprise', 'msp');
CREATE TYPE organization_member_status AS ENUM ('active', 'invited', 'suspended', 'removed');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
CREATE TYPE system_role AS ENUM (
  'owner', 'admin', 'device_manager', 'technician', 'viewer', 'auditor', 'msp_admin'
);
CREATE TYPE device_platform AS ENUM ('windows', 'macos', 'linux', 'other');
CREATE TYPE device_registration_status AS ENUM ('pending', 'active', 'revoked', 'decommissioned');
CREATE TYPE presence_status AS ENUM ('online', 'offline', 'stale', 'unknown');
CREATE TYPE session_status AS ENUM (
  'requested', 'policy_denied', 'pending_agent', 'negotiating',
  'active', 'ended', 'failed', 'cancelled'
);
CREATE TYPE session_type AS ENUM ('attended', 'unattended');
CREATE TYPE session_end_reason AS ENUM (
  'user_disconnect', 'technician_disconnect', 'agent_reject', 'policy_revoked',
  'timeout', 'network_error', 'admin_terminate', 'error'
);
CREATE TYPE session_event_type AS ENUM (
  'requested', 'policy_evaluated', 'mfa_completed', 'invite_sent',
  'agent_accepted', 'agent_rejected', 'signaling_started', 'webrtc_connected',
  'webrtc_failed', 'file_transfer_started', 'file_transfer_completed',
  'recording_started', 'recording_stopped', 'terminated', 'error'
);
CREATE TYPE file_transfer_direction AS ENUM ('upload_to_device', 'download_from_device');
CREATE TYPE file_transfer_status AS ENUM (
  'pending', 'in_progress', 'completed', 'failed', 'cancelled', 'blocked'
);
CREATE TYPE audit_actor_type AS ENUM ('user', 'device', 'system', 'api_key', 'support');
CREATE TYPE audit_category AS ENUM (
  'organization', 'user', 'device', 'policy', 'session',
  'integration', 'security', 'billing', 'agent'
);
CREATE TYPE audit_severity AS ENUM ('info', 'warning', 'critical');

-- M003: updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Core tenant tables
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(63) NOT NULL,
  status organization_status NOT NULL DEFAULT 'trial',
  tier subscription_tier NOT NULL DEFAULT 'starter',
  data_region VARCHAR(16) NOT NULL DEFAULT 'us-east',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_org_slug_active
  ON organizations (parent_organization_id, slug)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE organization_settings (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  unattended_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_required BOOLEAN NOT NULL DEFAULT TRUE,
  session_recording_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  max_concurrent_sessions INT NOT NULL DEFAULT 10,
  file_transfer_max_bytes BIGINT NOT NULL DEFAULT 5368709120,
  ip_allowlist INET[],
  retention_audit_days INT NOT NULL DEFAULT 90,
  retention_session_days INT NOT NULL DEFAULT 90,
  e2ee_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_organization_settings_updated_at
  BEFORE UPDATE ON organization_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL,
  email_verified_at TIMESTAMPTZ,
  password_hash VARCHAR(255),
  display_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_users_email_active ON users (email) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role system_role NOT NULL,
  status organization_member_status NOT NULL DEFAULT 'active',
  custom_permissions JSONB,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_org_member_active
  ON organization_members (organization_id, user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_org_members_org ON organization_members (organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_members_user ON organization_members (user_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RBAC permission catalog
CREATE TABLE permissions (
  id VARCHAR(64) PRIMARY KEY,
  description TEXT NOT NULL,
  category VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
  role system_role NOT NULL,
  permission_id VARCHAR(64) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_id)
);

-- Devices
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  hostname VARCHAR(255) NOT NULL,
  friendly_name VARCHAR(255),
  platform device_platform NOT NULL,
  os_version VARCHAR(64),
  agent_version VARCHAR(32),
  registration_status device_registration_status NOT NULL DEFAULT 'pending',
  last_known_presence presence_status NOT NULL DEFAULT 'unknown',
  last_seen_at TIMESTAMPTZ,
  last_seen_ip INET,
  last_console_user VARCHAR(255),
  hardware_info JSONB,
  unattended_enabled BOOLEAN,
  notes TEXT,
  registered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_devices_org_last_seen
  ON devices (organization_id, last_seen_at DESC)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE device_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  credential_hash VARCHAR(255) NOT NULL,
  public_key_fingerprint VARCHAR(64),
  label VARCHAR(64) NOT NULL DEFAULT 'primary',
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_device_credentials_active
  ON device_credentials (device_id)
  WHERE revoked_at IS NULL;

CREATE TABLE device_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tag VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (device_id, tag)
);

CREATE TABLE organization_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  rules JSONB NOT NULL,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_org_policies_org_active
  ON organization_policies (organization_id)
  WHERE deleted_at IS NULL AND is_active = TRUE;

CREATE TRIGGER trg_organization_policies_updated_at
  BEFORE UPDATE ON organization_policies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Sessions (immutable header — no deleted_at)
CREATE TABLE remote_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE RESTRICT,
  initiated_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  type session_type NOT NULL,
  status session_status NOT NULL DEFAULT 'requested',
  end_reason session_end_reason,
  policy_snapshot JSONB,
  mfa_verified_at TIMESTAMPTZ,
  client_ip INET,
  user_agent TEXT,
  webrtc_transport VARCHAR(16),
  turn_allocation_id VARCHAR(64),
  bytes_sent BIGINT,
  bytes_received BIGINT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  agent_accepted_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  error_code VARCHAR(64),
  error_message TEXT,
  trace_id VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_remote_sessions_org_requested
  ON remote_sessions (organization_id, requested_at DESC);

CREATE UNIQUE INDEX uq_remote_sessions_device_active
  ON remote_sessions (device_id)
  WHERE status IN ('pending_agent', 'negotiating', 'active');

CREATE INDEX idx_remote_sessions_initiator
  ON remote_sessions (initiated_by_user_id, requested_at DESC);

CREATE TRIGGER trg_remote_sessions_updated_at
  BEFORE UPDATE ON remote_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE remote_session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remote_session_id UUID NOT NULL REFERENCES remote_sessions(id) ON DELETE CASCADE,
  participant_type VARCHAR(16) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ
);

-- Partitioned session event log
CREATE TABLE remote_session_events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  remote_session_id UUID NOT NULL REFERENCES remote_sessions(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  event_type session_event_type NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_type audit_actor_type,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB,
  message TEXT,
  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

CREATE TABLE remote_session_events_2026_05 PARTITION OF remote_session_events
  FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');

CREATE TABLE remote_session_events_2026_06 PARTITION OF remote_session_events
  FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');

CREATE TABLE remote_session_events_2026_07 PARTITION OF remote_session_events
  FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');

CREATE INDEX idx_remote_session_events_session_2026_05
  ON remote_session_events_2026_05 (remote_session_id, occurred_at DESC);

-- File transfer audit log
CREATE TABLE file_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remote_session_id UUID NOT NULL REFERENCES remote_sessions(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE RESTRICT,
  initiated_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  direction file_transfer_direction NOT NULL,
  status file_transfer_status NOT NULL DEFAULT 'pending',
  file_name VARCHAR(512) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  sha256_hash CHAR(64),
  mime_type VARCHAR(128),
  source_path TEXT,
  destination_path TEXT,
  blocked_reason TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_file_transfers_session ON file_transfers (remote_session_id, created_at DESC);

-- Partitioned immutable audit log
CREATE TABLE audit_events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
  category audit_category NOT NULL,
  action VARCHAR(128) NOT NULL,
  severity audit_severity NOT NULL DEFAULT 'info',
  actor_type audit_actor_type NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  actor_api_key_id UUID,
  target_type VARCHAR(64),
  target_id UUID,
  remote_session_id UUID REFERENCES remote_sessions(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  trace_id VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_events_2026_05 PARTITION OF audit_events
  FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');

CREATE TABLE audit_events_2026_06 PARTITION OF audit_events
  FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');

CREATE TABLE audit_events_2026_07 PARTITION OF audit_events
  FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');

CREATE INDEX idx_audit_events_2026_05_org_created
  ON audit_events_2026_05 (organization_id, created_at DESC);

CREATE INDEX idx_audit_events_2026_05_category
  ON audit_events_2026_05 (organization_id, category, created_at DESC);

-- Audit immutability
CREATE OR REPLACE FUNCTION deny_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_events_deny_update
  BEFORE UPDATE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION deny_audit_mutation();

CREATE TRIGGER trg_audit_events_deny_delete
  BEFORE DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION deny_audit_mutation();

-- Auth support
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
