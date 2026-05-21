import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().min(1).default('api/v1'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug']).default('info'),
  DATABASE_URL: z
    .string()
    .min(1)
    .refine((value) => value.startsWith('postgres://') || value.startsWith('postgresql://'), {
      message: 'DATABASE_URL must be a PostgreSQL connection string',
    }),
  REDIS_URL: z
    .string()
    .min(1)
    .refine((value) => value.startsWith('redis://') || value.startsWith('rediss://'), {
      message: 'REDIS_URL must be a Redis connection string',
    }),
  DB_POOL_MAX: z.coerce.number().int().positive().default(20),
  DB_LOGGING: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  JWT_SECRET: z.string().min(32).default('local-dev-jwt-secret-min-32-characters!!'),
  JWT_ACCESS_EXPIRES_IN: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_EXPIRES_IN: z.coerce.number().int().positive().default(604_800),
  REFRESH_COOKIE_NAME: z.string().min(1).default('rh_refresh'),
  WS_PUBLIC_URL: z.string().url().optional(),
  GATEWAY_INSTANCE_ID: z.string().min(1).optional(),
  HEARTBEAT_INTERVAL_SECONDS: z.coerce.number().int().positive().default(15),
  HEARTBEAT_TTL_SECONDS: z.coerce.number().int().positive().default(45),
  PRESENCE_STALE_GRACE_SECONDS: z.coerce.number().int().positive().default(30),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    throw new Error(`Environment validation failed: ${JSON.stringify(formatted)}`);
  }
  return result.data;
}
