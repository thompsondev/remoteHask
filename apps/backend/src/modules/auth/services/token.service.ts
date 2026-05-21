import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import type { AppConfiguration } from '../../../config/configuration';
import type { JwtAccessPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfiguration, true>,
  ) {}

  signAccessToken(payload: JwtAccessPayload): string {
    const expiresIn = this.configService.get('jwt.accessExpiresIn', { infer: true });
    return this.jwtService.sign(payload, { expiresIn });
  }

  verifyAccessToken(token: string): JwtAccessPayload {
    return this.jwtService.verify<JwtAccessPayload>(token);
  }

  getAccessExpiresIn(): number {
    return this.configService.get('jwt.accessExpiresIn', { infer: true });
  }

  getRefreshExpiresIn(): number {
    return this.configService.get('jwt.refreshExpiresIn', { infer: true });
  }

  getRefreshCookieName(): string {
    return this.configService.get('jwt.refreshCookieName', { infer: true });
  }

  getRefreshExpiresAt(): Date {
    const seconds = this.getRefreshExpiresIn();
    return new Date(Date.now() + seconds * 1000);
  }
}
