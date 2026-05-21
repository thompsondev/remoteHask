import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorCode } from '@remotehask/shared-types';
import type { AgentEnrollResponseDto } from '@remotehask/shared-types';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';

import { ApiHttpException } from '../../../common/exceptions/api-http.exception';
import type { AppConfiguration } from '../../../config/configuration';
import { DeviceCredential } from '../../../database/entities/device-credential.entity';
import { Device } from '../../../database/entities/device.entity';
import { EnrollmentToken } from '../../../database/entities/enrollment-token.entity';
import { DeviceRegistrationStatus } from '../../../database/enums';
import { generateRefreshTokenValue, hashToken } from '../../auth/utils/token-hash.util';
import type { EnrollDeviceDto } from '../dto/enroll-device.dto';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(EnrollmentToken)
    private readonly enrollmentTokenRepository: Repository<EnrollmentToken>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(DeviceCredential)
    private readonly credentialRepository: Repository<DeviceCredential>,
    private readonly configService: ConfigService<AppConfiguration, true>,
  ) {}

  async enroll(dto: EnrollDeviceDto): Promise<AgentEnrollResponseDto> {
    const tokenHash = hashToken(dto.enrollmentToken);
    const enrollment = await this.enrollmentTokenRepository.findOne({
      where: { tokenHash, revokedAt: IsNull() },
    });

    if (!enrollment) {
      throw new ApiHttpException(
        ErrorCode.ENROLLMENT_TOKEN_INVALID,
        'Invalid enrollment token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (enrollment.expiresAt < new Date()) {
      throw new ApiHttpException(
        ErrorCode.ENROLLMENT_TOKEN_EXPIRED,
        'Enrollment token has expired',
        HttpStatus.GONE,
      );
    }

    if (enrollment.useCount >= enrollment.maxUses) {
      throw new ApiHttpException(
        ErrorCode.ENROLLMENT_TOKEN_INVALID,
        'Enrollment token usage limit reached',
        HttpStatus.GONE,
      );
    }

    const device = await this.deviceRepository.save(
      this.deviceRepository.create({
        organizationId: enrollment.organizationId,
        hostname: dto.hostname,
        platform: dto.platform,
        osVersion: dto.osVersion ?? null,
        agentVersion: dto.agentVersion,
        registrationStatus: DeviceRegistrationStatus.ACTIVE,
        hardwareInfo: dto.hardwareInfo ?? null,
        registeredAt: new Date(),
      }),
    );

    const plainDeviceToken = generateRefreshTokenValue();
    const credentialHash = await bcrypt.hash(plainDeviceToken, 12);

    await this.credentialRepository.save(
      this.credentialRepository.create({
        deviceId: device.id,
        credentialHash,
        label: 'primary',
      }),
    );

    enrollment.useCount += 1;
    await this.enrollmentTokenRepository.save(enrollment);

    const publicUrl = this.configService.get('gateway.publicUrl', { infer: true });
    const apiPrefix = this.configService.get('apiPrefix', { infer: true });

    return {
      deviceId: device.id,
      organizationId: enrollment.organizationId,
      deviceToken: plainDeviceToken,
      deviceTokenExpiresAt: null,
      wsUrl: publicUrl,
      apiUrl: `${publicUrl}/${apiPrefix}`,
    };
  }

  async createEnrollmentToken(params: {
    organizationId: string;
    createdByUserId: string;
    expiresInMinutes?: number;
    maxUses?: number;
  }): Promise<{ enrollmentToken: string; tokenId: string; expiresAt: string }> {
    const plain = `enr_${generateRefreshTokenValue()}`;
    const expiresAt = new Date(Date.now() + (params.expiresInMinutes ?? 15) * 60_000);

    const record = await this.enrollmentTokenRepository.save(
      this.enrollmentTokenRepository.create({
        organizationId: params.organizationId,
        tokenHash: hashToken(plain),
        expiresAt,
        maxUses: params.maxUses ?? 1,
        createdByUserId: params.createdByUserId,
      }),
    );

    return {
      enrollmentToken: plain,
      tokenId: record.id,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
