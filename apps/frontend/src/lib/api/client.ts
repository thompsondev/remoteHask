import { ErrorCode, type ApiEnvelope } from '@remotehask/shared-types';

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return 'success' in record && typeof record.success === 'boolean';
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly traceId: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit & { accessToken?: string },
): Promise<T> {
  const { accessToken, ...fetchInit } = init ?? {};
  const headers = new Headers(fetchInit.headers);
  headers.set('Content-Type', 'application/json');
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...fetchInit,
    headers,
  });

  const raw: unknown = await response.json();
  if (!isApiEnvelope<T>(raw)) {
    throw new Error('Invalid API response envelope');
  }

  if (!raw.success) {
    throw new ApiError(raw.error.code, raw.error.message, raw.error.traceId, response.status);
  }

  return raw.data;
}

export function isTokenExpiredError(error: unknown): boolean {
  return error instanceof ApiError && error.code === ErrorCode.TOKEN_EXPIRED;
}
