import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

import type { AppConfiguration } from '../config/configuration';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfiguration, true>) => {
        const nodeEnv = configService.get('nodeEnv', { infer: true });
        const logLevel = configService.get('logLevel', { infer: true });
        const isDevelopment = nodeEnv === 'development';

        return {
          level: logLevel,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
          transports: [
            new winston.transports.Console({
              format: isDevelopment
                ? winston.format.combine(
                    winston.format.colorize(),
                    winston.format.printf(({ level, message, timestamp, context, ...meta }) => {
                      const ctx = typeof context === 'string' ? `[${context}] ` : '';
                      const extra = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
                      return `${String(timestamp)} ${level}: ${ctx}${String(message)}${extra}`;
                    }),
                  )
                : winston.format.json(),
            }),
          ],
        };
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
