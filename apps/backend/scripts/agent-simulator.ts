/**
 * Dev-only agent simulator: enroll + WebSocket heartbeat every 15s.
 *
 * Usage:
 *   ENROLLMENT_TOKEN=enr_xxx pnpm --filter @remotehask/backend agent:sim
 */
import { io } from 'socket.io-client';

const API_URL = process.env.API_URL ?? 'http://localhost:4000/api/v1';
const WS_URL = process.env.WS_URL ?? 'http://localhost:4000';
const ENROLLMENT_TOKEN = process.env.ENROLLMENT_TOKEN;

async function main(): Promise<void> {
  if (!ENROLLMENT_TOKEN) {
    throw new Error('Set ENROLLMENT_TOKEN env var (create via dashboard or API)');
  }

  const enrollResponse = await fetch(`${API_URL}/devices/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      enrollmentToken: ENROLLMENT_TOKEN,
      hostname: process.env.HOSTNAME ?? 'sim-workstation.local',
      platform: 'linux',
      osVersion: 'Ubuntu 24.04',
      agentVersion: '1.0.0',
      hardwareInfo: { cpu: 'sim', ramGb: 16 },
    }),
  });

  const enrollBody: unknown = await enrollResponse.json();
  if (!enrollResponse.ok) {
    console.error('Enroll failed', enrollBody);
    process.exit(1);
  }

  const data = (enrollBody as { data: { deviceId: string; deviceToken: string } }).data;
  console.info('Enrolled device', data.deviceId);

  const socket = io(`${WS_URL}/agents`, {
    transports: ['websocket'],
    auth: {
      token: data.deviceToken,
      clientType: 'agent',
      deviceId: data.deviceId,
    },
  });

  socket.on('connect', () => {
    console.info('Agent socket connected', socket.id);
    sendHeartbeat();
  });

  socket.on('disconnect', (reason) => {
    console.warn('Agent socket disconnected', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Connect error', error.message);
  });

  socket.io.on('reconnect', () => {
    console.info('Agent socket reconnected');
    sendHeartbeat();
  });

  function sendHeartbeat(): void {
    socket.emit(
      'agent:heartbeat',
      {
        deviceId: data.deviceId,
        agentVersion: '1.0.0',
        osUser: process.env.OS_USER ?? 'sim-user',
        metrics: { cpuPercent: Math.random() * 10, memoryMb: 120 },
      },
      (ack: { payload?: { nextHeartbeatSeconds?: number } }) => {
        const interval = (ack?.payload?.nextHeartbeatSeconds ?? 15) * 1000;
        setTimeout(sendHeartbeat, interval);
      },
    );
  }
}

void main();
