/** Standard REST envelopes — see API_SPECIFICATION.md */

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  limit: number;
  cursor: string | null;
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number | null;
}

export interface ApiErrorDetail {
  field: string;
  code: string;
  message: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details: ApiErrorDetail[];
  traceId: string;
}

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

export interface ApiErrorEnvelope {
  success: false;
  data: null;
  error: ApiErrorBody;
  meta: ResponseMeta;
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;
