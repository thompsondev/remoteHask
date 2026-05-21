/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Runtime contract validation for shared API/WS types.
 */
const {
  agentEnrollResponseSchema,
  authLoginResponseSchema,
  deviceDtoSchema,
  deviceListResponseSchema,
  devicePresencePayloadSchema,
  heartbeatResponseSchema,
  wsEventEnvelopeSchema,
} = require('../dist/validators');

const sampleDevice = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  hostname: 'workstation.local',
  friendlyName: null,
  platform: 'linux',
  osVersion: '24.04',
  agentVersion: '1.0.0',
  registrationStatus: 'active',
  presence: 'online',
  lastSeenAt: new Date().toISOString(),
  lastSeenIp: '127.0.0.1',
  lastConsoleUser: null,
  unattendedEnabled: false,
  tags: [],
};

const samples = [
  { name: 'DeviceDto', run: () => deviceDtoSchema.parse(sampleDevice) },
  {
    name: 'AuthLoginResponseDto',
    run: () =>
      authLoginResponseSchema.parse({
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        expiresIn: 900,
        tokenType: 'Bearer',
        user: {
          id: sampleDevice.id,
          email: 'admin@demo.remotehask.local',
          displayName: 'Demo Admin',
        },
        organizations: [
          {
            id: sampleDevice.organizationId,
            name: 'Demo Org',
            slug: 'demo',
            role: 'org_admin',
          },
        ],
        mfaRequired: false,
      }),
  },
  {
    name: 'AgentEnrollResponseDto',
    run: () =>
      agentEnrollResponseSchema.parse({
        deviceId: sampleDevice.id,
        organizationId: sampleDevice.organizationId,
        deviceToken: 'a'.repeat(32),
        deviceTokenExpiresAt: null,
        wsUrl: 'http://localhost:4000',
        apiUrl: 'http://localhost:4000/api/v1',
      }),
  },
  {
    name: 'DevicePresencePayload',
    run: () =>
      devicePresencePayloadSchema.parse({
        deviceId: sampleDevice.id,
        organizationId: sampleDevice.organizationId,
        presence: 'online',
        lastSeenAt: new Date().toISOString(),
        agentVersion: '1.0.0',
      }),
  },
  {
    name: 'WsEventEnvelope<DevicePresencePayload>',
    run: () =>
      wsEventEnvelopeSchema(devicePresencePayloadSchema).parse({
        eventId: '33333333-3333-4333-8333-333333333333',
        timestamp: new Date().toISOString(),
        payload: {
          deviceId: sampleDevice.id,
          organizationId: sampleDevice.organizationId,
          presence: 'offline',
          lastSeenAt: new Date().toISOString(),
        },
      }),
  },
  {
    name: 'Device list envelope',
    run: () =>
      deviceListResponseSchema.parse({
        success: true,
        data: { items: [sampleDevice] },
        meta: { requestId: 'req-1', timestamp: new Date().toISOString() },
      }),
  },
  {
    name: 'Heartbeat envelope',
    run: () =>
      heartbeatResponseSchema.parse({
        success: true,
        data: {
          acknowledged: true,
          nextHeartbeatSeconds: 15,
          pendingCommands: [],
        },
        meta: { requestId: 'req-2', timestamp: new Date().toISOString() },
      }),
  },
];

let failed = 0;

for (const sample of samples) {
  try {
    sample.run();
    console.info(`✓ ${sample.name}`);
  } catch (error) {
    failed += 1;
    console.error(`✗ ${sample.name}`, error);
  }
}

if (failed > 0) {
  process.exit(1);
}

console.info(`\nAll ${String(samples.length)} contract checks passed.`);
