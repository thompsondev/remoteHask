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
  jwt: {
    secret: string;
    accessExpiresIn: number;
    refreshExpiresIn: number;
    refreshCookieName: string;
  };
  gateway: {
    publicUrl: string;
    instanceId: string;
    heartbeatIntervalSeconds: number;
    heartbeatTtlSeconds: number;
    presenceStaleGraceSeconds: number;
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
    jwt: {
      secret: env.JWT_SECRET ?? '',
      accessExpiresIn: Number(env.JWT_ACCESS_EXPIRES_IN ?? 900),
      refreshExpiresIn: Number(env.JWT_REFRESH_EXPIRES_IN ?? 604_800),
      refreshCookieName: env.REFRESH_COOKIE_NAME ?? 'rh_refresh',
    },
    gateway: {
      publicUrl: env.WS_PUBLIC_URL ?? `http://localhost:${String(env.PORT ?? 4000)}`,
      instanceId: env.GATEWAY_INSTANCE_ID ?? `gw-${String(process.pid)}`,
      heartbeatIntervalSeconds: Number(env.HEARTBEAT_INTERVAL_SECONDS ?? 15),
      heartbeatTtlSeconds: Number(env.HEARTBEAT_TTL_SECONDS ?? 45),
      presenceStaleGraceSeconds: Number(env.PRESENCE_STALE_GRACE_SECONDS ?? 30),
    },
  };
}
