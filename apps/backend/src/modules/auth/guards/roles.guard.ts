import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '@remotehask/shared-types';

import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import { ApiHttpException } from '../../../common/exceptions/api-http.exception';
import type { SystemRole } from '../../../database/enums';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<SystemRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ApiHttpException(ErrorCode.UNAUTHORIZED, 'Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const allowed = requiredRoles.some((role) => user.roles.includes(role));
    if (!allowed) {
      throw new ApiHttpException(ErrorCode.FORBIDDEN, 'Insufficient role', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
