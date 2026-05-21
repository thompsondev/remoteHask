import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { FileTransferDirection, FileTransferStatus } from '../enums';

import { Device } from './device.entity';
import { Organization } from './organization.entity';
import { RemoteSession } from './remote-session.entity';
import { User } from './user.entity';

@Entity('file_transfers')
@Index('idx_file_transfers_session', ['remoteSessionId', 'createdAt'])
export class FileTransfer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'remote_session_id', type: 'uuid' })
  remoteSessionId!: string;

  @ManyToOne(() => RemoteSession, (session) => session.fileTransfers, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'remote_session_id' })
  remoteSession!: RemoteSession;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId!: string;

  @ManyToOne(() => Device, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'device_id' })
  device!: Device;

  @Column({ name: 'initiated_by_user_id', type: 'uuid' })
  initiatedByUserId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'initiated_by_user_id' })
  initiatedByUser!: User;

  @Column({
    type: 'enum',
    enum: FileTransferDirection,
    enumName: 'file_transfer_direction',
  })
  direction!: FileTransferDirection;

  @Column({
    type: 'enum',
    enum: FileTransferStatus,
    enumName: 'file_transfer_status',
    default: FileTransferStatus.PENDING,
  })
  status!: FileTransferStatus;

  @Column({ name: 'file_name', type: 'varchar', length: 512 })
  fileName!: string;

  @Column({ name: 'file_size_bytes', type: 'bigint' })
  fileSizeBytes!: string;

  @Column({ name: 'sha256_hash', type: 'char', length: 64, nullable: true })
  sha256Hash!: string | null;

  @Column({ name: 'mime_type', type: 'varchar', length: 128, nullable: true })
  mimeType!: string | null;

  @Column({ name: 'source_path', type: 'text', nullable: true })
  sourcePath!: string | null;

  @Column({ name: 'destination_path', type: 'text', nullable: true })
  destinationPath!: string | null;

  @Column({ name: 'blocked_reason', type: 'text', nullable: true })
  blockedReason!: string | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
