import type { ApiSuccessEnvelope } from '@remotehask/shared-types';

export function expectSuccessEnvelope<T>(body: unknown): ApiSuccessEnvelope<T> {
  expect(body).toMatchObject({ success: true });
  return body as ApiSuccessEnvelope<T>;
}
