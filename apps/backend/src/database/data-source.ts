import 'reflect-metadata';

import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { entities } from './entities';
import { InitialSchema1716200000000 } from './migrations/1716200000000-InitialSchema';
import { EnrollmentTokens1716300000000 } from './migrations/1716300000000-EnrollmentTokens';

config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for TypeORM data source');
}

/** TypeORM DataSource — use for migrations and CLI (`pnpm db:migrate`). */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [...entities],
  migrations: [InitialSchema1716200000000, EnrollmentTokens1716300000000],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
});
