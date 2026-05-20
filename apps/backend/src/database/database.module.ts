import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import type { AppConfiguration } from '../config/configuration';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfiguration, true>) => {
        const database = configService.get('database', { infer: true });

        return {
          type: 'postgres' as const,
          url: database.url,
          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: false,
          namingStrategy: new SnakeNamingStrategy(),
          logging: database.logging,
          extra: {
            max: database.poolMax,
          },
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
