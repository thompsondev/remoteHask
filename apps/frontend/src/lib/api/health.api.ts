import { apiClient } from './axios-instance';

export interface HealthResponse {
  status: string;
}

export interface ReadinessResponse {
  status: string;
  checks: Record<string, string>;
}

export const healthApi = {
  liveness: () => apiClient.get<HealthResponse>('/health'),

  readiness: () => apiClient.get<ReadinessResponse>('/health/ready'),
};
