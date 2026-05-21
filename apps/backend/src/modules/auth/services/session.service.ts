import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';

import { RefreshToken } from '../../../database/entities/refresh-token.entity';
import { generateRefreshTokenValue, hashToken } from '../utils/token-hash.util';

export interface RefreshSessionResult {
  refreshToken: string;
  record: RefreshToken;
}

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async createSession(
    userId: string,
    expiresAt: Date,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RefreshSessionResult> {
    const refreshToken = generateRefreshTokenValue();

    const record = await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt,
        userAgent: userAgent ?? null,
        ipAddress: ipAddress ?? null,
      }),
    );

    return { refreshToken, record };
  }

  async rotateSession(
    plainRefreshToken: string,
    expiresAt: Date,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RefreshSessionResult> {
    const existing = await this.findValidToken(plainRefreshToken);

    if (!existing) {
      return Promise.reject(new Error('INVALID_REFRESH'));
    }

    existing.revokedAt = new Date();
    await this.refreshTokenRepository.save(existing);

    return this.createSession(existing.userId, expiresAt, userAgent, ipAddress);
  }

  async revokeByPlainToken(plainRefreshToken: string): Promise<void> {
    const existing = await this.findValidToken(plainRefreshToken);
    if (!existing) {
      return;
    }

    existing.revokedAt = new Date();
    await this.refreshTokenRepository.save(existing);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private async findValidToken(plainRefreshToken: string): Promise<RefreshToken | null> {
    const tokenHash = hashToken(plainRefreshToken);

    return this.refreshTokenRepository.findOne({
      where: {
        tokenHash,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }
}
