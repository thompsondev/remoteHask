import type { DevicePlatform, PresenceStatus, SessionStatus, SessionType } from '../enums/index';

export interface UserSummaryDto {
  id: string;
  email: string;
  displayName: string;
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
