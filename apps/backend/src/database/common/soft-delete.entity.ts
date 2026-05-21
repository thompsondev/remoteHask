import { DeleteDateColumn } from 'typeorm';

import { BaseEntity } from './base.entity';

export abstract class SoftDeleteEntity extends BaseEntity {
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
