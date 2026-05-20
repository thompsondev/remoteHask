import type { EnvConfig } from './env.schema';

export interface AppConfiguration {
  nodeEnv: EnvConfig['NODE_ENV'];
  port: number;
  apiPrefix: string;
  corsOrigin: string;
  logLevel: EnvConfig['LOG_LEVEL'];
  database: {
    url: string;
    poolMax: number;
    logging: boolean;
  };
  redis: {
    url: string;
  };
}

export default function configuration(): AppConfiguration {
  const env = process.env as Record<string, string | undefined>;

  return {
    nodeEnv: (env.NODE_ENV ?? 'development') as AppConfiguration['nodeEnv'],
    port: Number(env.PORT ?? 4000),
    apiPrefix: env.API_PREFIX ?? 'api/v1',
    corsOrigin: env.CORS_ORIGIN ?? 'http://localhost:3000',
    logLevel: (env.LOG_LEVEL ?? 'info') as AppConfiguration['logLevel'],
    database: {
      url: env.DATABASE_URL ?? '',
      poolMax: Number(env.DB_POOL_MAX ?? 20),
      logging: env.DB_LOGGING === 'true',
    },
    redis: {
      url: env.REDIS_URL ?? '',
    },
  };
}
