export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
export const REDIS_SUBSCRIBER = Symbol('REDIS_SUBSCRIBER');

export const REDIS_KEYS = {
  presenceDevice: (deviceId: string): string => `presence:device:${deviceId}`,
  presenceOrgOnline: (organizationId: string): string => `presence:org:${organizationId}:online`,
  deviceConn: (deviceId: string): string => `device:conn:${deviceId}`,
} as const;

export const REDIS_CHANNELS = {
  presenceChange: 'presence:change',
} as const;
