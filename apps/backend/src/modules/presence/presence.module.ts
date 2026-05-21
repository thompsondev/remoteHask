import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Device } from '../../database/entities/device.entity';

import { DeviceLifecycleService } from './device-lifecycle.service';
import { PresenceService } from './presence.service';

@Module({
  imports: [TypeOrmModule.forFeature([Device])],
  providers: [PresenceService, DeviceLifecycleService],
  exports: [PresenceService, DeviceLifecycleService],
})
export class PresenceModule {}
