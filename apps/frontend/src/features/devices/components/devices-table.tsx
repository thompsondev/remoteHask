'use client';

import type { DeviceDto } from '@remotehask/shared-types';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

function presenceVariant(
  presence: DeviceDto['presence'],
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (presence) {
    case 'online':
      return 'default';
    case 'stale':
      return 'secondary';
    case 'offline':
      return 'destructive';
    default:
      return 'outline';
  }
}

interface DevicesTableProps {
  devices: DeviceDto[];
  isLoading: boolean;
}

export function DevicesTable({ devices, isLoading }: DevicesTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No devices registered yet. Create an enrollment token and install the agent.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Device</th>
            <th className="px-4 py-3 font-medium">Platform</th>
            <th className="px-4 py-3 font-medium">Presence</th>
            <th className="px-4 py-3 font-medium">Agent</th>
            <th className="px-4 py-3 font-medium">Last seen</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <tr key={device.id} className="border-t">
              <td className="px-4 py-3">
                <div className="font-medium">{device.friendlyName ?? device.hostname}</div>
                <div className="text-xs text-muted-foreground">{device.hostname}</div>
              </td>
              <td className="px-4 py-3 capitalize">{device.platform}</td>
              <td className="px-4 py-3">
                <Badge variant={presenceVariant(device.presence)}>{device.presence}</Badge>
              </td>
              <td className="px-4 py-3">{device.agentVersion ?? '—'}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
