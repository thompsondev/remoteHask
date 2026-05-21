import type { ReactNode } from 'react';

import { GuestGuard } from '@/components/auth/guest-guard';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <GuestGuard>
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">remoteHask</h1>
          <p className="text-sm text-muted-foreground">Remote desktop & device management</p>
        </div>
        {children}
      </div>
    </GuestGuard>
  );
}
