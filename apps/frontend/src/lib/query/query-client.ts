import { QueryClient } from '@tanstack/react-query';

import { ApiError, isUnauthorizedError } from '@/lib/api/errors';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
        onError: (error) => {
          if (isUnauthorizedError(error) && typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        },
      },
    },
  });
}
