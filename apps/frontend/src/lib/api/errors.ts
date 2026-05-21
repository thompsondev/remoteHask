import { ErrorCode, type ApiEnvelope, type ApiErrorEnvelope } from '@remotehask/shared-types';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly traceId: string,
    public readonly status: number,
    public readonly details: ApiErrorEnvelope['error']['details'] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return 'success' in record && typeof record.success === 'boolean';
}

export function isTokenExpiredError(error: unknown): boolean {
  return error instanceof ApiError && error.code === ErrorCode.TOKEN_EXPIRED;
}

export function isUnauthorizedError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === ErrorCode.UNAUTHORIZED || error.code === ErrorCode.TOKEN_EXPIRED)
  );
}
