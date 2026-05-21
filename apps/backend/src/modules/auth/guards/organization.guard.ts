import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '@remotehask/shared-types';

import { ApiHttpException } from '../../../common/exceptions/api-http.exception';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { RbacService } from '../services/rbac.service';

@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(private readonly rbacService: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      headers: Record<string, string | string[] | undefined>;
    }>();

    const user = request.user;
    if (!user) {
      throw new ApiHttpException(ErrorCode.UNAUTHORIZED, 'Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const organizationId = request.headers['x-organization-id'];
    if (typeof organizationId !== 'string' || organizationId.length === 0) {
      throw new ApiHttpException(
        ErrorCode.VALIDATION_FAILED,
        'X-Organization-Id header is required',
        HttpStatus.BAD_REQUEST,
        [
          {
            field: 'X-Organization-Id',
            code: 'REQUIRED',
            message: 'Organization context header is required',
          },
        ],
      );
    }

    const membership = await this.rbacService.getMembership(user.userId, organizationId);
    if (!membership) {
      throw new ApiHttpException(
        ErrorCode.ORG_ACCESS_DENIED,
        'Organization access denied',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
