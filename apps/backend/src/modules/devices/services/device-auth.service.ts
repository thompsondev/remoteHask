import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorCode } from '@remotehask/shared-types';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';

import { ApiHttpException } from '../../../common/exceptions/api-http.exception';
import { DeviceCredential } from '../../../database/entities/device-credential.entity';
import { Device } from '../../../database/entities/device.entity';
import { DeviceRegistrationStatus } from '../../../database/enums';

export interface AuthenticatedDevice {
  deviceId: string;
  organizationId: string;
}

@Injectable()
export class DeviceAuthService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(DeviceCredential)
    private readonly credentialRepository: Repository<DeviceCredential>,
  ) {}

  async authenticateDeviceToken(
    deviceId: string,
    plainToken: string,
  ): Promise<AuthenticatedDevice> {
    const device = await this.deviceRepository.findOne({
      where: { id: deviceId, deletedAt: IsNull() },
    });

    if (!device || device.registrationStatus === DeviceRegistrationStatus.REVOKED) {
      throw new ApiHttpException(
        ErrorCode.UNAUTHORIZED,
        'Invalid device credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const credentials = await this.credentialRepository.find({
      where: { deviceId, revokedAt: IsNull() },
    });

    let valid = false;
    for (const credential of credentials) {
      if (await bcrypt.compare(plainToken, credential.credentialHash)) {
        valid = true;
        credential.lastUsedAt = new Date();
        await this.credentialRepository.save(credential);
        break;
      }
    }

    if (!valid) {
      throw new ApiHttpException(
        ErrorCode.UNAUTHORIZED,
        'Invalid device credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      deviceId: device.id,
      organizationId: device.organizationId,
    };
  }
}
