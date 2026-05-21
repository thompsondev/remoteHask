/** Socket.IO event payload types — see API_SPECIFICATION.md §21 */

export interface WsEventEnvelope<T> {
  eventId: string;
  timestamp: string;
  payload: T;
}

export interface WsAckResponse {
  ok: boolean;
  room?: string;
  message?: string;
}

export interface SocketConnectedPayload {
  socketId: string;
  serverTime: string;
  rooms: string[];
}

export interface DevicePresencePayload {
  deviceId: string;
  organizationId: string;
  presence: 'online' | 'offline' | 'stale' | 'unknown';
  lastSeenAt: string;
  agentVersion?: string | null;
  lastConsoleUser?: string | null;
}

export interface AgentHeartbeatPayload {
  deviceId: string;
  agentVersion: string;
  osUser: string;
  metrics?: { cpuPercent?: number; memoryMb?: number };
}

export interface AgentHeartbeatAckPayload {
  nextHeartbeatSeconds: number;
  pendingCommands: unknown[];
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

export interface AgentEnrollResponseDto {
  deviceId: string;
  organizationId: string;
  deviceToken: string;
  deviceTokenExpiresAt: string | null;
  wsUrl: string;
  apiUrl: string;
}
