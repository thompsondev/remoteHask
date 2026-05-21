import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { MigrationInterface, QueryRunner } from 'typeorm';

function loadSql(filename: string): string {
  return readFileSync(join(__dirname, 'sql', filename), 'utf8');
}

export class InitialSchema1716200000000 implements MigrationInterface {
  name = 'InitialSchema1716200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(loadSql('initial-schema.up.sql'));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(loadSql('initial-schema.down.sql'));
  }
}
