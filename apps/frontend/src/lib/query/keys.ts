export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  health: {
    liveness: ['health', 'liveness'] as const,
    readiness: ['health', 'readiness'] as const,
  },
  devices: {
    all: ['devices'] as const,
    list: (filters?: Record<string, string | number | undefined>) =>
      ['devices', 'list', filters] as const,
    detail: (deviceId: string) => ['devices', 'detail', deviceId] as const,
  },
  sessions: {
    all: ['sessions'] as const,
    list: (filters?: Record<string, string | undefined>) => ['sessions', 'list', filters] as const,
    detail: (sessionId: string) => ['sessions', 'detail', sessionId] as const,
  },
} as const;
