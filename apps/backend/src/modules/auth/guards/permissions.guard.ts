import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '@remotehask/shared-types';

import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { ApiHttpException } from '../../../common/exceptions/api-http.exception';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ApiHttpException(ErrorCode.UNAUTHORIZED, 'Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const hasAll = required.every((permission) => user.permissions.includes(permission));
    if (!hasAll) {
      throw new ApiHttpException(
        ErrorCode.FORBIDDEN,
        'Insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
