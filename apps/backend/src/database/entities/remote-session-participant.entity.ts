import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Device } from './device.entity';
import { RemoteSession } from './remote-session.entity';
import { User } from './user.entity';

@Entity('remote_session_participants')
export class RemoteSessionParticipant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'remote_session_id', type: 'uuid' })
  remoteSessionId!: string;

  @ManyToOne(() => RemoteSession, (session) => session.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'remote_session_id' })
  remoteSession!: RemoteSession;

  @Column({ name: 'participant_type', type: 'varchar', length: 16 })
  participantType!: 'user' | 'device';

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ name: 'device_id', type: 'uuid', nullable: true })
  deviceId!: string | null;

  @ManyToOne(() => Device, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'device_id' })
  device!: Device | null;

  @Column({ name: 'joined_at', type: 'timestamptz', default: () => 'NOW()' })
  joinedAt!: Date;

  @Column({ name: 'left_at', type: 'timestamptz', nullable: true })
  leftAt!: Date | null;
}
