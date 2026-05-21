'use client';

import type { AuthLoginResponseDto, AuthMfaChallengeResponseDto } from '@remotehask/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { authApi, type LoginRequest, type RegisterRequest } from '@/lib/api/auth.api';
import { clearAuthCookie, setAuthCookie } from '@/lib/auth/cookies';
import { queryKeys } from '@/lib/query/keys';
import { useAuthStore } from '@/stores/auth.store';

function isMfaChallenge(
  data: AuthLoginResponseDto | AuthMfaChallengeResponseDto,
): data is AuthMfaChallengeResponseDto {
  return 'mfaRequired' in data && data.mfaRequired;
}

function applyLoginSuccess(
  data: AuthLoginResponseDto,
  setSession: ReturnType<typeof useAuthStore.getState>['setSession'],
): void {
  setSession({
    accessToken: data.accessToken,
    user: {
      id: data.user.id,
      email: data.user.email,
      displayName: data.user.displayName,
      avatarUrl: data.user.avatarUrl ?? null,
      emailVerified: data.user.emailVerified,
    },
    organizations: data.organizations,
  });
  setAuthCookie();
}

export function useMeQuery(enabled = true) {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const { data } = await authApi.me();
      return data;
    },
    enabled: enabled && isHydrated && Boolean(accessToken),
    staleTime: 60_000,
    retry: false,
  });
}

export function useLoginMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      const { data } = await authApi.login(payload);
      return data;
    },
    onSuccess: (data) => {
      if (isMfaChallenge(data)) {
        router.push(`/login/mfa?challenge=${data.mfaChallengeId}`);
        return;
      }

      applyLoginSuccess(data, setSession);
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      router.replace('/dashboard');
    },
  });
}

export function useRegisterMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (payload: RegisterRequest) => {
      const { data } = await authApi.register(payload);
      return data;
    },
    onSuccess: (data) => {
      applyLoginSuccess(data, setSession);
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      router.replace('/dashboard');
    },
  });
}

export function useLogoutMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((s) => s.clearSession);

  return useMutation({
    mutationFn: async (allDevices?: boolean) => {
      try {
        await authApi.logout({ allDevices: allDevices ?? false });
      } finally {
        clearSession();
        clearAuthCookie();
        queryClient.clear();
      }
    },
    onSettled: () => {
      router.replace('/login');
    },
  });
}
