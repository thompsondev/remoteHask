import type { Server } from 'http';

import type { INestApplication } from '@nestjs/common';
import type { AuthLoginResponseDto } from '@remotehask/shared-types';
import { authLoginResponseSchema } from '@remotehask/shared-types';
import request from 'supertest';

import { expectSuccessEnvelope } from './helpers/api-envelope';
import { getHttpServer } from './helpers/http-server';
import { closeTestApp, createTestApp } from './helpers/test-app';

const hasIntegrationEnv = Boolean(process.env.DATABASE_URL && process.env.REDIS_URL);

const describeIntegration = hasIntegrationEnv ? describe : describe.skip;

describeIntegration('Auth (e2e)', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    app = await createTestApp();
    server = getHttpServer(app);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('POST /auth/login returns typed success envelope', async () => {
    const response = await request(server)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@demo.remotehask.local',
        password: 'ChangeMe!123',
      })
      .expect(200);

    const envelope = expectSuccessEnvelope<AuthLoginResponseDto>(response.body);
    const login = authLoginResponseSchema.parse(envelope.data);
    expect(login.tokenType).toBe('Bearer');
    expect(login.mfaRequired).toBe(false);
    expect(login.organizations.length).toBeGreaterThan(0);
  });

  it('POST /auth/login rejects invalid credentials', async () => {
    await request(server)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@demo.remotehask.local',
        password: 'wrong-password',
      })
      .expect(401);
  });
});
