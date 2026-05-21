import type { DeviceDto } from '@remotehask/shared-types';
import type { PaginationMeta } from '@remotehask/shared-types';

import { apiClient } from './axios-instance';

export interface ListDevicesParams {
  limit?: number;
  cursor?: string;
  presence?: string;
  platform?: string;
  q?: string;
}

export interface ListDevicesResponse {
  items: DeviceDto[];
  pagination?: PaginationMeta;
}

export const devicesApi = {
  list: (params?: ListDevicesParams) =>
    apiClient.get<ListDevicesResponse>('/organizations/current/devices', { params }),

  createEnrollmentToken: () =>
    apiClient.post<{ enrollmentToken: string; tokenId: string; expiresAt: string }>(
      '/organizations/current/enrollment-tokens',
      {},
    ),
};
