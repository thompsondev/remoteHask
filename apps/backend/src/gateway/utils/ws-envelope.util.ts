import { randomUUID } from 'node:crypto';

import type { WsEventEnvelope } from '@remotehask/shared-types';

export function createWsEnvelope<T>(payload: T): WsEventEnvelope<T> {
  return {
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    payload,
  };
}
