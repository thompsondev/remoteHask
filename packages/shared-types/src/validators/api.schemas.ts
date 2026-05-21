import { z } from 'zod';

import type { ApiSuccessEnvelope } from '../api/envelope';
import type { AuthLoginResponseDto, DeviceDto } from '../api/models';
import type { AgentEnrollResponseDto, DevicePresencePayload, WsEventEnvelope } from '../ws/index';

const presenceStatusSchema = z.enum(['online', 'offline', 'stale', 'unknown']);
const devicePlatformSchema = z.enum(['windows', 'macos', 'linux', 'other']);

export const deviceDtoSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  hostname: z.string(),
  friendlyName: z.string().nullable(),
  platform: devicePlatformSchema,
  osVersion: z.string().nullable(),
  agentVersion: z.string().nullable(),
  registrationStatus: z.string(),
  presence: presenceStatusSchema,
  lastSeenAt: z.string().nullable(),
  lastSeenIp: z.string().nullable(),
  lastConsoleUser: z.string().nullable(),
  unattendedEnabled: z.boolean().nullable(),
  tags: z.array(z.string()),
}) satisfies z.ZodType<DeviceDto>;

export const authLoginResponseSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  tokenType: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    displayName: z.string(),
    avatarUrl: z.string().nullable().optional(),
    emailVerified: z.boolean().optional(),
  }),
  organizations: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
      role: z.string(),
      status: z.string().optional(),
    }),
  ),
  mfaRequired: z.boolean(),
  mfaChallengeId: z.string().optional(),
  methods: z.array(z.string()).optional(),
}) satisfies z.ZodType<AuthLoginResponseDto>;

export const agentEnrollResponseSchema = z.object({
  deviceId: z.string().uuid(),
  organizationId: z.string().uuid(),
  deviceToken: z.string().min(16),
  deviceTokenExpiresAt: z.string().nullable(),
  wsUrl: z.string().url(),
  apiUrl: z.string().url(),
}) satisfies z.ZodType<AgentEnrollResponseDto>;

export const devicePresencePayloadSchema = z.object({
  deviceId: z.string().uuid(),
  organizationId: z.string().uuid(),
  presence: presenceStatusSchema,
  lastSeenAt: z.string(),
  agentVersion: z.string().nullable().optional(),
  lastConsoleUser: z.string().nullable().optional(),
}) satisfies z.ZodType<DevicePresencePayload>;

export const responseMetaSchema = z.object({
  requestId: z.string(),
  timestamp: z.string(),
  pagination: z
    .object({
      limit: z.number(),
      cursor: z.string().nullable(),
      nextCursor: z.string().nullable(),
      hasMore: z.boolean(),
      totalCount: z.number().nullable(),
    })
    .optional(),
});

export function apiSuccessEnvelopeSchema<T extends z.ZodType>(
  dataSchema: T,
): z.ZodType<ApiSuccessEnvelope<z.infer<T>>> {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: responseMetaSchema,
  }) as z.ZodType<ApiSuccessEnvelope<z.infer<T>>>;
}

export function wsEventEnvelopeSchema<T extends z.ZodType>(
  payloadSchema: T,
): z.ZodType<WsEventEnvelope<z.infer<T>>> {
  return z.object({
    eventId: z.string().uuid(),
    timestamp: z.string(),
    payload: payloadSchema,
  }) as z.ZodType<WsEventEnvelope<z.infer<T>>>;
}

export const deviceListResponseSchema = apiSuccessEnvelopeSchema(
  z.object({ items: z.array(deviceDtoSchema) }),
);

export const heartbeatResponseSchema = apiSuccessEnvelopeSchema(
  z.object({
    acknowledged: z.boolean(),
    nextHeartbeatSeconds: z.number().int().positive(),
    pendingCommands: z.array(z.unknown()),
  }),
);
