import { io, type Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

export function createConsoleSocket(accessToken: string, organizationId: string): Socket {
  return io(`${WS_URL}/console`, {
    autoConnect: false,
    transports: ['websocket'],
    auth: {
      token: accessToken,
      clientType: 'console',
      organizationId,
    },
  });
}
