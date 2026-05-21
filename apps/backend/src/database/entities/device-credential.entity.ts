import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Device } from './device.entity';

@Entity('device_credentials')
@Index('idx_device_credentials_active', ['deviceId'], {
  unique: true,
  where: '"revoked_at" IS NULL',
})
export class DeviceCredential {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId!: string;

  @ManyToOne(() => Device, (device) => device.credentials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device!: Device;

  @Column({ name: 'credential_hash', type: 'varchar', length: 255 })
  credentialHash!: string;

  @Column({ name: 'public_key_fingerprint', type: 'varchar', length: 64, nullable: true })
  publicKeyFingerprint!: string | null;

  @Column({ type: 'varchar', length: 64, default: 'primary' })
  label!: string;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;
}
