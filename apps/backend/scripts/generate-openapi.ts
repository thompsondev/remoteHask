/**
 * Writes OpenAPI JSON for CI/docs. Requires built app modules.
 *
 * Usage: pnpm --filter @remotehask/backend openapi:generate
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '../src/app.module';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  const port = Number(process.env.PORT ?? 4000);
  const apiPrefix = process.env.API_PREFIX ?? 'api/v1';

  app.setGlobalPrefix(apiPrefix);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('remoteHask API')
    .setDescription(
      [
        'Remote desktop and device management platform.',
        '',
        'WebSocket namespaces (not in OpenAPI):',
        '- `/console` — operator dashboard (JWT)',
        '- `/agents` — desktop agent (device token)',
        '',
        'See docs/DEVICE_PRESENCE.md for presence events and scaling notes.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .addServer(`http://localhost:${String(port)}`, 'Local')
    .addTag('auth', 'User authentication and sessions')
    .addTag('devices', 'Device enrollment, heartbeat, and inventory')
    .addTag('health', 'Liveness and readiness probes')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const outputPath = resolve(__dirname, '../openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));
  await app.close();
  console.info(`OpenAPI spec written to ${outputPath}`);
  process.exit(0);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
