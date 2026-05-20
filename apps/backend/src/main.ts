import { type LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module';
import type { AppConfiguration } from './config/configuration';

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

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('remoteHask API')
    .setDescription('Remote desktop and device management platform')
    .setVersion('1.0')
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
