import { type LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module';
import type { AppConfiguration } from './config/configuration';
import { RedisIoAdapter } from './gateway/adapters/redis-io.adapter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  const config = app.get(ConfigService<AppConfiguration, true>);
  const nodeEnv = config.get('nodeEnv', { infer: true });
  const port = config.get('port', { infer: true });
  const apiPrefix = config.get('apiPrefix', { infer: true });
  const corsOrigin = config.get('corsOrigin', { infer: true });

  app.setGlobalPrefix(apiPrefix);
  app.use(cookieParser());

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const redis = config.get('redis', { infer: true });
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(redis.url);
  app.useWebSocketAdapter(redisIoAdapter);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('remoteHask API')
    .setDescription(
      [
        'Remote desktop and device management platform.',
        '',
        '**WebSocket namespaces** (see [DEVICE_PRESENCE.md](https://github.com/remotehask/remoteHask/blob/main/docs/DEVICE_PRESENCE.md)):',
        '- `/console` — JWT auth, `device:presence` events, org rooms',
        '- `/agents` — device token auth, `agent:heartbeat` with ack',
        '',
        'REST responses use `{ success, data, meta }` envelopes.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addTag('auth', 'User authentication and sessions')
    .addTag('devices', 'Device enrollment, heartbeat, and inventory')
    .addTag('health', 'Liveness and readiness probes')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .addServer(`http://localhost:${String(port)}`, 'Local')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(port);

  logger.log(`Application running on port ${String(port)} (${nodeEnv})`, 'Bootstrap');
  logger.log(`Swagger docs: http://localhost:${String(port)}/docs`, 'Bootstrap');
  logger.log(`API base: http://localhost:${String(port)}/${apiPrefix}`, 'Bootstrap');
}

void bootstrap();
