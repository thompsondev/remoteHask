import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import type { AppConfiguration } from '../config/configuration';

import { REDIS_CLIENT, REDIS_SUBSCRIBER } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfiguration, true>): Redis => {
        const redis = configService.get('redis', { infer: true });
        return new Redis(redis.url, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
        });
      },
    },
    {
      provide: REDIS_SUBSCRIBER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfiguration, true>): Redis => {
        const redis = configService.get('redis', { infer: true });
        return new Redis(redis.url, {
          maxRetriesPerRequest: null,
          enableReadyCheck: true,
        });
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, REDIS_SUBSCRIBER, RedisService],
})
export class RedisModule {}
