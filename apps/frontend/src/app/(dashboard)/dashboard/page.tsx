'use client';

import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { healthApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/keys';
import { useSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';

export default function DashboardOverviewPage() {
  const user = useAuthStore((s) => s.user);
  const { isConnected, lastPresenceEvent } = useSocket();

  const health = useQuery({
    queryKey: queryKeys.health.readiness,
    queryFn: async () => {
      const { data } = await healthApi.readiness();
      return data;
    },
    retry: false,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          Welcome back{user?.displayName ? `, ${user.displayName}` : ''}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Realtime</CardTitle>
            <CardDescription>Console WebSocket channel</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Status:{' '}
              <span className={isConnected ? 'text-green-600' : 'text-muted-foreground'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </p>
            {lastPresenceEvent ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Last presence: {lastPresenceEvent.deviceId} → {lastPresenceEvent.presence}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API</CardTitle>
            <CardDescription>Backend readiness probe</CardDescription>
          </CardHeader>
          <CardContent>
            {health.isLoading ? (
              <Skeleton className="h-5 w-32" />
            ) : health.isError ? (
              <p className="text-sm text-destructive">Backend unreachable</p>
            ) : (
              <p className="text-sm">
                Status: <span className="font-medium">{health.data?.status}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Common operator tasks</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Device inventory, remote sessions, and org settings will appear here as backend modules
            ship.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
