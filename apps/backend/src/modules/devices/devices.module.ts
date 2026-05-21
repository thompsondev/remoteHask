import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeviceCredential } from '../../database/entities/device-credential.entity';
import { DeviceTag } from '../../database/entities/device-tag.entity';
import { Device } from '../../database/entities/device.entity';
import { EnrollmentToken } from '../../database/entities/enrollment-token.entity';
import { AuthModule } from '../auth/auth.module';
import { PresenceModule } from '../presence/presence.module';

import { DevicesController } from './devices.controller';
import { DeviceAuthGuard } from './guards/device-auth.guard';
import { DeviceAuthService } from './services/device-auth.service';
import { DevicesService } from './services/devices.service';
import { EnrollmentService } from './services/enrollment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, DeviceCredential, DeviceTag, EnrollmentToken]),
    AuthModule,
    PresenceModule,
  ],
  controllers: [DevicesController],
  providers: [DevicesService, EnrollmentService, DeviceAuthService, DeviceAuthGuard],
  exports: [DevicesService, EnrollmentService, DeviceAuthService],
})
export class DevicesModule {}
