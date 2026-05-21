'use client';

import type { DeviceDto, DevicePresencePayload } from '@remotehask/shared-types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { devicesApi, type ListDevicesParams } from '@/lib/api/devices.api';
import { queryKeys } from '@/lib/query/keys';
import { useAuthStore } from '@/stores/auth.store';

export function useDevicesQuery(params?: ListDevicesParams) {
  const organizationId = useAuthStore((s) => s.currentOrganizationId);

  return useQuery({
    queryKey: queryKeys.devices.list({ organizationId: organizationId ?? undefined, ...params }),
    queryFn: async () => {
      const { data } = await devicesApi.list(params);
      return data;
    },
    enabled: Boolean(organizationId),
    staleTime: 10_000,
  });
}

export function useDevicePresenceUpdater() {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((s) => s.currentOrganizationId);

  return useCallback(
    (event: DevicePresencePayload) => {
      if (!organizationId || event.organizationId !== organizationId) {
        return;
      }

      queryClient.setQueriesData<{ items: DeviceDto[] }>(
        { queryKey: ['devices', 'list'] },
        (current) => {
          if (!current?.items) {
            return current;
          }

          return {
            ...current,
            items: current.items.map((device) =>
              device.id === event.deviceId
                ? {
                    ...device,
                    presence: event.presence,
                    lastSeenAt: event.lastSeenAt,
                    agentVersion: event.agentVersion ?? device.agentVersion,
                    lastConsoleUser: event.lastConsoleUser ?? device.lastConsoleUser,
                  }
                : device,
            ),
          };
        },
      );
    },
    [organizationId, queryClient],
  );
}
