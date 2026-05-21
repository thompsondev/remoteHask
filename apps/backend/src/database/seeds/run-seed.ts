import { AppDataSource } from '../data-source';

import { runInitialSeed } from './initial.seed';

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run seeds in production');
  }

  await AppDataSource.initialize();

  try {
    await runInitialSeed(AppDataSource);
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
