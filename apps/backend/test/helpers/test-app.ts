import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type Redis from 'ioredis';

import { AppModule } from '../../src/app.module';
import { globalValidationPipe } from '../../src/common/pipes/validation.pipe';
import { REDIS_CLIENT, REDIS_SUBSCRIBER } from '../../src/redis/redis.constants';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api/v1');
  app.use(cookieParser());
  app.useGlobalPipes(globalValidationPipe);
  await app.init();
  return app;
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  const redis = app.get<Redis>(REDIS_CLIENT);
  const subscriber = app.get<Redis>(REDIS_SUBSCRIBER);
  await app.close();
  redis.disconnect();
  subscriber.disconnect();
}
