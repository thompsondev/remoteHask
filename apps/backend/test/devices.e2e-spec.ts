import type { Server } from 'http';

import type { INestApplication } from '@nestjs/common';
import type { AgentEnrollResponseDto, AuthLoginResponseDto } from '@remotehask/shared-types';
import {
  agentEnrollResponseSchema,
  authLoginResponseSchema,
  deviceDtoSchema,
  deviceListResponseSchema,
  heartbeatResponseSchema,
} from '@remotehask/shared-types';
import request from 'supertest';

import { expectSuccessEnvelope } from './helpers/api-envelope';
import { getHttpServer } from './helpers/http-server';
import { closeTestApp, createTestApp } from './helpers/test-app';

const hasIntegrationEnv = Boolean(process.env.DATABASE_URL && process.env.REDIS_URL);

const describeIntegration = hasIntegrationEnv ? describe : describe.skip;

describeIntegration('Devices & presence (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let accessToken: string;
  let organizationId: string;

  beforeAll(async () => {
    app = await createTestApp();
    server = getHttpServer(app);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('logs in as seeded demo admin', async () => {
    const response = await request(server)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@demo.remotehask.local',
        password: 'ChangeMe!123',
      })
      .expect(200);

    const envelope = expectSuccessEnvelope<AuthLoginResponseDto>(response.body);
    const login = authLoginResponseSchema.parse(envelope.data);
    accessToken = login.accessToken;
    organizationId = login.organizations[0]?.id ?? '';
    expect(organizationId).toBeTruthy();
  });

  it('creates enrollment token, enrolls device, heartbeats, lists online', async () => {
    const tokenResponse = await request(server)
      .post('/api/v1/organizations/current/enrollment-tokens')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Organization-Id', organizationId)
      .send({})
      .expect(201);

    const tokenEnvelope = expectSuccessEnvelope<{
      enrollmentToken: string;
      tokenId: string;
      expiresAt: string;
    }>(tokenResponse.body);
    expect(tokenEnvelope.data.enrollmentToken).toMatch(/^enr_/);

    const enrollResponse = await request(server)
      .post('/api/v1/devices/enroll')
      .send({
        enrollmentToken: tokenEnvelope.data.enrollmentToken,
        hostname: `e2e-${String(Date.now())}.local`,
        platform: 'linux',
        osVersion: '24.04',
        agentVersion: '1.0.0',
        hardwareInfo: { cpu: 'test' },
      })
      .expect(201);

    const enrollEnvelope = expectSuccessEnvelope<AgentEnrollResponseDto>(enrollResponse.body);
    const enrolled = agentEnrollResponseSchema.parse(enrollEnvelope.data);

    const heartbeatResponse = await request(server)
      .post('/api/v1/devices/heartbeat')
      .set('Authorization', `Bearer ${enrolled.deviceToken}`)
      .set('X-Device-Id', enrolled.deviceId)
      .send({
        agentVersion: '1.0.0',
        osUser: 'e2e-user',
        metrics: { cpuPercent: 1, memoryMb: 100 },
      })
      .expect(200);

    const heartbeatEnvelope = heartbeatResponseSchema.parse(heartbeatResponse.body);
    expect(heartbeatEnvelope.data.acknowledged).toBe(true);
    expect(heartbeatEnvelope.data.nextHeartbeatSeconds).toBeGreaterThan(0);

    const listResponse = await request(server)
      .get('/api/v1/organizations/current/devices')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Organization-Id', organizationId)
      .expect(200);

    const listEnvelope = deviceListResponseSchema.parse(listResponse.body);
    const device = listEnvelope.data.items.find((item) => item.id === enrolled.deviceId);
    expect(device).toBeDefined();
    deviceDtoSchema.parse(device);
    expect(device?.presence).toBe('online');
  }, 30_000);
});
