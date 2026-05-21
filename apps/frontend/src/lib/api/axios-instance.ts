import { ErrorCode, type ApiEnvelope } from '@remotehask/shared-types';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { ApiError, isApiEnvelope, isTokenExpiredError } from './errors';

import { useAuthStore } from '@/stores/auth.store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= (async () => {
    try {
      const response = await axios.post<ApiEnvelope<{ accessToken: string }>>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const body = response.data;
      if (!isApiEnvelope(body) || !body.success) {
        return null;
      }

      const token = body.data.accessToken;
      useAuthStore.getState().setAccessToken(token);
      return token;
    } catch {
      useAuthStore.getState().clearSession();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken, currentOrganizationId } = useAuthStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (currentOrganizationId) {
    config.headers['X-Organization-Id'] = currentOrganizationId;
  }

  config.headers['X-Request-Id'] = crypto.randomUUID();

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const body: unknown = response.data;

    if (!isApiEnvelope(body)) {
      throw new ApiError(ErrorCode.INTERNAL_ERROR, 'Invalid API response envelope', '', 500);
    }

    if (!body.success) {
      throw new ApiError(
        body.error.code,
        body.error.message,
        body.error.traceId,
        response.status,
        body.error.details,
      );
    }

    response.data = body.data;
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status ?? 500;
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const body: unknown = error.response?.data;

    const apiError =
      isApiEnvelope(body) && !body.success
        ? new ApiError(
            body.error.code,
            body.error.message,
            body.error.traceId,
            status,
            body.error.details,
          )
        : null;

    const shouldRefresh =
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      (apiError ? isTokenExpiredError(apiError) : true);

    if (shouldRefresh) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
    }

    if (apiError) {
      throw apiError;
    }

    throw new ApiError(
      ErrorCode.INTERNAL_ERROR,
      error.message || 'Network request failed',
      '',
      status,
    );
  },
);
