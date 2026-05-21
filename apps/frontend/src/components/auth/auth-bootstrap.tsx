'use client';

import { useEffect, type ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useMeQuery } from '@/features/auth/hooks/use-auth';
import { setAuthCookie } from '@/lib/auth/cookies';
import { useAuthStore } from '@/stores/auth.store';

interface AuthBootstrapProps {
  children: ReactNode;
}

/** Hydrates session from GET /auth/me after persisted access token loads. */
export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);
  const currentToken = useAuthStore((s) => s.accessToken);

  const { data, isFetched } = useMeQuery(Boolean(accessToken));

  useEffect(() => {
    if (!data || !currentToken) {
      return;
    }

    setSession({
      accessToken: currentToken,
      user: {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.displayName,
        avatarUrl: data.user.avatarUrl ?? null,
        emailVerified: data.user.emailVerified,
      },
      organizations: data.organizations,
      currentOrganizationId: data.currentOrganizationId,
    });
    setAuthCookie();
  }, [data, currentToken, setSession]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (accessToken && !isFetched) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return <>{children}</>;
}
