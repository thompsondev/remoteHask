import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '@remotehask/shared-types';
import type { Request } from 'express';

import { ApiHttpException } from '../../../common/exceptions/api-http.exception';
import { DeviceAuthService, type AuthenticatedDevice } from '../services/device-auth.service';

@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(private readonly deviceAuthService: DeviceAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { device?: AuthenticatedDevice }>();

    const deviceId = request.header('x-device-id');
    const authorization = request.header('authorization');

    if (!deviceId || !authorization?.startsWith('Bearer ')) {
      throw new ApiHttpException(
        ErrorCode.UNAUTHORIZED,
        'Device credentials required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authorization.slice('Bearer '.length);
    request.device = await this.deviceAuthService.authenticateDeviceToken(deviceId, token);

    return true;
  }
}
