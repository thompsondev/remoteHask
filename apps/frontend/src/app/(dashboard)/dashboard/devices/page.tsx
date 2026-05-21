'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { DevicesTable } from '@/features/devices/components/devices-table';
import { useDevicesQuery } from '@/features/devices/hooks/use-devices';
import { devicesApi } from '@/lib/api/devices.api';
import { useSocket } from '@/lib/socket';

export default function DevicesPage() {
  const { data, isLoading, refetch } = useDevicesQuery();
  const { isConnected } = useSocket();
  const [enrollmentToken, setEnrollmentToken] = useState<string | null>(null);
  const [creatingToken, setCreatingToken] = useState(false);

  const handleCreateToken = async (): Promise<void> => {
    setCreatingToken(true);
    try {
      const { data: tokenData } = await devicesApi.createEnrollmentToken();
      setEnrollmentToken(tokenData.enrollmentToken);
    } finally {
      setCreatingToken(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Devices</h1>
          <p className="text-muted-foreground">
            Live inventory {isConnected ? '(realtime connected)' : '(reconnecting…)'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void refetch()}>
            Refresh
          </Button>
          <Button onClick={() => void handleCreateToken()} disabled={creatingToken}>
            {creatingToken ? 'Creating…' : 'Enrollment token'}
          </Button>
        </div>
      </div>

      {enrollmentToken ? (
        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="font-medium">One-time enrollment token</p>
          <p className="mt-1 break-all font-mono text-xs">{enrollmentToken}</p>
          <p className="mt-2 text-muted-foreground">
            Use with the agent simulator or installer. Expires in 15 minutes.
          </p>
        </div>
      ) : null}

      <DevicesTable devices={data?.items ?? []} isLoading={isLoading} />
    </div>
  );
}
