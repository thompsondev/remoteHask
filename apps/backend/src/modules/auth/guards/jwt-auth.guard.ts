import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ErrorCode } from '@remotehask/shared-types';

import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { ApiHttpException } from '../../../common/exceptions/api-http.exception';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser>(
    err: Error | null,
    user: TUser,
    info: { name?: string; message?: string } | undefined,
  ): TUser {
    if (info?.name === 'TokenExpiredError') {
      throw new ApiHttpException(
        ErrorCode.TOKEN_EXPIRED,
        'Access token expired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (err || !user) {
      throw new ApiHttpException(ErrorCode.UNAUTHORIZED, 'Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }
}
