import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { globalValidationPipe } from './common/pipes/validation.pipe';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
import { HealthModule } from './modules/health/health.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [AppConfigModule, LoggerModule, DatabaseModule, RedisModule, HealthModule],
  providers: [
    { provide: APP_PIPE, useValue: globalValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}
