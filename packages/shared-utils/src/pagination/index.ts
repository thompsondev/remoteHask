import type { PaginationMeta } from '@remotehask/shared-types';

export interface CursorPayload {
  id: string;
  s: string;
}

const CURSOR_ENCODING = 'utf-8' as const;

export function encodeCursor(payload: CursorPayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json, CURSOR_ENCODING).toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const json = Buffer.from(cursor, 'base64url').toString(CURSOR_ENCODING);
    const parsed: unknown = JSON.parse(json);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'id' in parsed &&
      's' in parsed &&
      typeof (parsed as CursorPayload).id === 'string' &&
      typeof (parsed as CursorPayload).s === 'string'
    ) {
      return parsed as CursorPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export function buildPaginationMeta(options: {
  limit: number;
  cursor: string | null;
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number | null;
}): PaginationMeta {
  return {
    limit: options.limit,
    cursor: options.cursor,
    nextCursor: options.nextCursor,
    hasMore: options.hasMore,
    totalCount: options.totalCount ?? null,
  };
}
