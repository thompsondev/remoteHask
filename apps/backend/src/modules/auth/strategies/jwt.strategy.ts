import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { AppConfiguration } from '../../../config/configuration';
import { SystemRole } from '../../../database/enums';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import type { JwtAccessPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService<AppConfiguration, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret', { infer: true }),
    });
  }

  validate(payload: JwtAccessPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      email: payload.email,
      orgId: payload.orgId,
      roles: payload.roles as SystemRole[],
      permissions: payload.permissions,
      mfa: payload.mfa,
    };
  }
}
