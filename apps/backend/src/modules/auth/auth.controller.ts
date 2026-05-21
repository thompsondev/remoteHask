import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type {
  AuthLoginResponseDto,
  AuthMeResponseDto,
  AuthMfaChallengeResponseDto,
  AuthRefreshResponseDto,
} from '@remotehask/shared-types';
import type { Request, Response } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login success or MFA challenge' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthLoginResponseDto | AuthMfaChallengeResponseDto> {
    const result = await this.authService.login(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    if (result.kind === 'mfa') {
      return result.data;
    }

    this.setRefreshCookie(res, result.refreshToken);
    return result.data;
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user and organization' })
  @ApiBody({ type: RegisterDto })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthLoginResponseDto> {
    const result = await this.authService.register(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    this.setRefreshCookie(res, result.refreshToken);
    return result.data;
  }

  @Public()
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete MFA challenge' })
  @ApiBody({ type: MfaVerifyDto })
  mfaVerify(@Body() _dto: MfaVerifyDto): AuthLoginResponseDto {
    return this.authService.mfaVerify();
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  @ApiBody({ type: RefreshDto })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthRefreshResponseDto> {
    const cookieName = this.tokenService.getRefreshCookieName();
    const fromCookie = req.cookies[cookieName] as string | undefined;
    const plainToken = fromCookie ?? dto.refreshToken;

    const result = await this.authService.refresh(plainToken ?? '', {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    this.setRefreshCookie(res, result.refreshToken);
    return result.response;
  }

  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke refresh session' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LogoutDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ loggedOut: boolean }> {
    const cookieName = this.tokenService.getRefreshCookieName();
    const plainToken = req.cookies[cookieName] as string | undefined;

    const result = await this.authService.logout(user.userId, plainToken, dto.allDevices ?? false);
    this.clearRefreshCookie(res);
    return result;
  }

  @ApiBearerAuth('access-token')
  @Get('me')
  @ApiOperation({ summary: 'Current user profile and memberships' })
  async me(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-id') organizationId?: string,
  ): Promise<AuthMeResponseDto> {
    return this.authService.me(user, organizationId);
  }

  private setRefreshCookie(res: Response, refreshToken: string): void {
    const maxAge = this.tokenService.getRefreshExpiresIn() * 1000;
    const cookieName = this.tokenService.getRefreshCookieName();

    res.cookie(cookieName, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });
  }

  private clearRefreshCookie(res: Response): void {
    const cookieName = this.tokenService.getRefreshCookieName();
    res.clearCookie(cookieName, { path: '/' });
  }
}
