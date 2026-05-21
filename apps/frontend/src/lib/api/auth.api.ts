import type {
  AuthLoginResponseDto,
  AuthMeResponseDto,
  AuthMfaChallengeResponseDto,
  AuthRefreshResponseDto,
  OrganizationMembershipDto,
} from '@remotehask/shared-types';

import { apiClient } from './axios-instance';

export type OrganizationSummary = OrganizationMembershipDto;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  organizationName: string;
  organizationSlug?: string;
}

export type LoginResponse = AuthLoginResponseDto | AuthMfaChallengeResponseDto;

export type MeResponse = AuthMeResponseDto;

export const authApi = {
  login: (payload: LoginRequest) =>
    apiClient.post<AuthLoginResponseDto | AuthMfaChallengeResponseDto>('/auth/login', payload),

  register: (payload: RegisterRequest) =>
    apiClient.post<AuthLoginResponseDto>('/auth/register', payload),

  logout: (payload: { allDevices?: boolean } = {}) =>
    apiClient.post<{ loggedOut: boolean }>('/auth/logout', payload),

  me: () => apiClient.get<AuthMeResponseDto>('/auth/me'),

  refresh: () => apiClient.post<AuthRefreshResponseDto>('/auth/refresh', {}),

  mfaVerify: (payload: { mfaChallengeId: string; method: 'totp'; code: string }) =>
    apiClient.post<AuthLoginResponseDto>('/auth/mfa/verify', payload),
};
