/** Socket.IO event payload types — see API_SPECIFICATION.md §21 */

export interface WsEventEnvelope<T> {
  eventId: string;
  timestamp: string;
  payload: T;
}

export interface DevicePresencePayload {
  deviceId: string;
  organizationId: string;
  presence: 'online' | 'offline' | 'stale' | 'unknown';
  lastSeenAt: string;
}

export interface SessionInvitePayload {
  sessionId: string;
  type: 'attended' | 'unattended';
  initiatedBy: { userId: string; displayName: string };
  policy: {
    fileTransferEnabled: boolean;
    clipboardEnabled: boolean;
  };
  timeoutSeconds: number;
}

export interface SignalingOfferPayload {
  sessionId: string;
  sdp: { type: string; sdp: string };
}

export interface AgentHeartbeatPayload {
  deviceId: string;
  agentVersion: string;
  osUser: string;
  metrics?: { cpuPercent?: number; memoryMb?: number };
}
