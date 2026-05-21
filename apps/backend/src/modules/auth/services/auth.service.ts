import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  AuthLoginResponseDto,
  AuthMeResponseDto,
  AuthMfaChallengeResponseDto,
  AuthRefreshResponseDto,
  UserSummaryDto,
} from '@remotehask/shared-types';
import { ErrorCode } from '@remotehask/shared-types';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';

import { ApiHttpException } from '../../../common/exceptions/api-http.exception';
import { OrganizationMember } from '../../../database/entities/organization-member.entity';
import { OrganizationSettings } from '../../../database/entities/organization-settings.entity';
import { Organization } from '../../../database/entities/organization.entity';
import { User } from '../../../database/entities/user.entity';
import {
  OrganizationMemberStatus,
  OrganizationStatus,
  SubscriptionTier,
  SystemRole,
} from '../../../database/enums';
import type { LoginDto } from '../dto/login.dto';
import type { RegisterDto } from '../dto/register.dto';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { slugifyOrganizationName } from '../utils/token-hash.util';

import { RbacService } from './rbac.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationSettings)
    private readonly settingsRepository: Repository<OrganizationSettings>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepository: Repository<OrganizationMember>,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly rbacService: RbacService,
  ) {}

  async login(
    dto: LoginDto,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<
    | { kind: 'auth'; data: AuthLoginResponseDto; refreshToken: string }
    | { kind: 'mfa'; data: AuthMfaChallengeResponseDto }
  > {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase(), deletedAt: IsNull() },
    });

    if (!user?.passwordHash) {
      throw new ApiHttpException(
        ErrorCode.UNAUTHORIZED,
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new ApiHttpException(
        ErrorCode.UNAUTHORIZED,
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // MFA challenge flow reserved for a follow-up when UserMfaFactor is wired.
    const issued = await this.issueAuthResponse(user, meta);
    return { kind: 'auth', data: issued.data, refreshToken: issued.refreshToken };
  }

  async register(
    dto: RegisterDto,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<{ data: AuthLoginResponseDto; refreshToken: string }> {
    const email = dto.email.toLowerCase();

    const existing = await this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
    });

    if (existing) {
      throw new ApiHttpException(
        ErrorCode.CONFLICT,
        'An account with this email already exists',
        HttpStatus.CONFLICT,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const slug = dto.organizationSlug ?? slugifyOrganizationName(dto.organizationName);

    const slugTaken = await this.organizationRepository.findOne({
      where: { slug, parentOrganizationId: IsNull(), deletedAt: IsNull() },
    });

    if (slugTaken) {
      throw new ApiHttpException(
        ErrorCode.CONFLICT,
        'Organization slug is already taken',
        HttpStatus.CONFLICT,
        [{ field: 'organizationSlug', code: 'CONFLICT', message: 'Slug already in use' }],
      );
    }

    const organization = await this.organizationRepository.save(
      this.organizationRepository.create({
        name: dto.organizationName,
        slug,
        status: OrganizationStatus.TRIAL,
        tier: SubscriptionTier.STARTER,
      }),
    );

    await this.settingsRepository.save(
      this.settingsRepository.create({ organizationId: organization.id }),
    );

    const user = await this.userRepository.save(
      this.userRepository.create({
        email,
        displayName: dto.displayName,
        passwordHash,
        emailVerifiedAt: null,
      }),
    );

    await this.memberRepository.save(
      this.memberRepository.create({
        organizationId: organization.id,
        userId: user.id,
        role: SystemRole.OWNER,
        status: OrganizationMemberStatus.ACTIVE,
      }),
    );

    const issued = await this.issueAuthResponse(user, meta);
    return { data: issued.data, refreshToken: issued.refreshToken };
  }

  async refresh(
    plainRefreshToken: string,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<{ response: AuthRefreshResponseDto; refreshToken: string }> {
    try {
      const rotated = await this.sessionService.rotateSession(
        plainRefreshToken,
        this.tokenService.getRefreshExpiresAt(),
        meta.userAgent,
        meta.ipAddress,
      );

      const user = await this.userRepository.findOne({
        where: { id: rotated.record.userId, deletedAt: IsNull() },
      });

      if (!user) {
        throw new Error('INVALID_REFRESH');
      }

      const organizations = await this.rbacService.getActiveMemberships(user.id);
      const primaryOrg = organizations[0] ?? null;
      const member = primaryOrg
        ? await this.rbacService.getMembership(user.id, primaryOrg.id)
        : null;

      const permissions = member
        ? await this.rbacService.resolvePermissions(member.role, member.customPermissions ?? null)
        : [];

      const accessToken = this.tokenService.signAccessToken({
        sub: user.id,
        email: user.email,
        orgId: primaryOrg?.id ?? null,
        roles: member ? [member.role] : [],
        permissions,
        mfa: false,
      });

      return {
        refreshToken: rotated.refreshToken,
        response: {
          accessToken,
          expiresIn: this.tokenService.getAccessExpiresIn(),
          tokenType: 'Bearer',
        },
      };
    } catch {
      throw new ApiHttpException(
        ErrorCode.UNAUTHORIZED,
        'Refresh token invalid or expired',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async logout(
    userId: string,
    plainRefreshToken: string | undefined,
    allDevices: boolean,
  ): Promise<{ loggedOut: boolean }> {
    if (allDevices) {
      await this.sessionService.revokeAllForUser(userId);
    } else if (plainRefreshToken) {
      await this.sessionService.revokeByPlainToken(plainRefreshToken);
    }

    return { loggedOut: true };
  }

  async me(user: AuthenticatedUser, organizationHeader?: string): Promise<AuthMeResponseDto> {
    const dbUser = await this.userRepository.findOne({
      where: { id: user.userId, deletedAt: IsNull() },
    });

    if (!dbUser) {
      throw new ApiHttpException(ErrorCode.UNAUTHORIZED, 'User not found', HttpStatus.UNAUTHORIZED);
    }

    const organizations = await this.rbacService.getActiveMemberships(user.userId);

    const headerOrgValid =
      organizationHeader &&
      organizations.some((organization) => organization.id === organizationHeader);

    return {
      user: this.toUserDto(dbUser),
      organizations,
      currentOrganizationId: headerOrgValid
        ? organizationHeader
        : (user.orgId ?? organizations[0]?.id ?? null),
    };
  }

  mfaVerify(): never {
    throw new ApiHttpException(
      ErrorCode.VALIDATION_FAILED,
      'MFA is not enabled in this environment',
      HttpStatus.UNPROCESSABLE_ENTITY,
      [{ field: 'code', code: 'INVALID', message: 'MFA not configured' }],
    );
  }

  private async issueAuthResponse(
    user: User,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<{ data: AuthLoginResponseDto; refreshToken: string }> {
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    const organizations = await this.rbacService.getActiveMemberships(user.id);
    const primaryOrg = organizations[0] ?? null;
    const member = primaryOrg ? await this.rbacService.getMembership(user.id, primaryOrg.id) : null;

    const permissions = member
      ? await this.rbacService.resolvePermissions(member.role, member.customPermissions ?? null)
      : [];

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      orgId: primaryOrg?.id ?? null,
      roles: member ? [member.role] : [],
      permissions,
      mfa: Boolean(user.emailVerifiedAt),
    });

    const session = await this.sessionService.createSession(
      user.id,
      this.tokenService.getRefreshExpiresAt(),
      meta.userAgent,
      meta.ipAddress,
    );

    return {
      refreshToken: session.refreshToken,
      data: {
        accessToken,
        expiresIn: this.tokenService.getAccessExpiresIn(),
        tokenType: 'Bearer',
        user: this.toUserDto(user),
        organizations,
        mfaRequired: false,
      },
    };
  }

  private toUserDto(user: User): UserSummaryDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      emailVerified: Boolean(user.emailVerifiedAt),
    };
  }
}
