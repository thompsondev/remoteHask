import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { RedisService } from '../../redis/redis.service';

export interface HealthCheckResult {
  status: 'ok' | 'error';
}

export interface ReadinessCheckResult {
  status: 'ok' | 'error';
  checks: {
    postgres: 'ok' | 'down';
    redis: 'ok' | 'down';
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  getLiveness(): HealthCheckResult {
    return { status: 'ok' };
  }

  async getReadiness(): Promise<ReadinessCheckResult> {
    let postgres: 'ok' | 'down' = 'down';
    let redis: 'ok' | 'down' = 'down';

    try {
      await this.dataSource.query('SELECT 1');
      postgres = 'ok';
    } catch {
      postgres = 'down';
    }

    try {
      const pong = await this.redisService.ping();
      if (pong === 'PONG') {
        redis = 'ok';
      }
    } catch {
      redis = 'down';
    }

    const status = postgres === 'ok' && redis === 'ok' ? 'ok' : 'error';

    return {
      status,
      checks: { postgres, redis },
    };
  }
}
