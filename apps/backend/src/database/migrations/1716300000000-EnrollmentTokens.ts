import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { MigrationInterface, QueryRunner } from 'typeorm';

function loadSql(filename: string): string {
  return readFileSync(join(__dirname, 'sql', filename), 'utf8');
}

export class EnrollmentTokens1716300000000 implements MigrationInterface {
  name = 'EnrollmentTokens1716300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(loadSql('1716300000000-enrollment-tokens.up.sql'));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(loadSql('1716300000000-enrollment-tokens.down.sql'));
  }
}
