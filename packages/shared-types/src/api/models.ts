import type { DevicePlatform, PresenceStatus, SessionStatus, SessionType } from '../enums/index';

export interface UserSummaryDto {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
}

export interface OrganizationMembershipDto {
  id: string;
  name: string;
  slug: string;
  role: string;
  status?: string;
}

export interface AuthLoginResponseDto {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  user: UserSummaryDto;
  organizations: OrganizationMembershipDto[];
  mfaRequired: boolean;
  mfaChallengeId?: string;
  methods?: string[];
}

export interface AuthMfaChallengeResponseDto {
  mfaRequired: true;
  mfaChallengeId: string;
  methods: string[];
}

export interface AuthRefreshResponseDto {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthMeResponseDto {
  user: UserSummaryDto;
  organizations: OrganizationMembershipDto[];
  currentOrganizationId: string | null;
}

export interface DeviceDto {
  id: string;
  organizationId: string;
  hostname: string;
  friendlyName: string | null;
  platform: DevicePlatform;
  osVersion: string | null;
  agentVersion: string | null;
  registrationStatus: string;
  presence: PresenceStatus;
  lastSeenAt: string | null;
  lastSeenIp: string | null;
  lastConsoleUser: string | null;
  unattendedEnabled: boolean | null;
  tags: string[];
}

export interface RemoteSessionDto {
  id: string;
  organizationId: string;
  deviceId: string;
  type: SessionType;
  status: SessionStatus;
  endReason: string | null;
  requestedAt: string;
  connectedAt: string | null;
  endedAt: string | null;
  webrtcTransport: 'p2p' | 'relay' | null;
}
