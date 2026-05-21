'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';

import { AuthBootstrap } from '@/components/auth/auth-bootstrap';
import { createQueryClient } from '@/lib/query/query-client';
import { SocketProvider } from '@/lib/socket';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <SocketProvider>
          <AuthBootstrap>{children}</AuthBootstrap>
        </SocketProvider>
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
