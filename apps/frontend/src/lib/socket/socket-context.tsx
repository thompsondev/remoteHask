'use client';

import type { DevicePresencePayload, WsEventEnvelope } from '@remotehask/shared-types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Socket } from 'socket.io-client';

import { createConsoleSocket } from './socket-client';

import { useDevicePresenceUpdater } from '@/features/devices/hooks/use-devices';
import { useAuthStore } from '@/stores/auth.store';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  lastPresenceEvent: DevicePresencePayload | null;
  joinDeviceRoom: (deviceId: string) => void;
  leaveDeviceRoom: (deviceId: string) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const organizationId = useAuthStore((s) => s.currentOrganizationId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const applyPresence = useDevicePresenceUpdater();

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastPresenceEvent, setLastPresenceEvent] = useState<DevicePresencePayload | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !organizationId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const socket = createConsoleSocket(accessToken, organizationId);
    socketRef.current = socket;

    const onConnect = (): void => {
      setIsConnected(true);
      socket.emit('org:join', { organizationId });
    };

    const onDisconnect = (): void => {
      setIsConnected(false);
    };

    const onPresence = (envelope: WsEventEnvelope<DevicePresencePayload>): void => {
      setLastPresenceEvent(envelope.payload);
      applyPresence(envelope.payload);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('device:presence', onPresence);

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('device:presence', onPresence);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [accessToken, organizationId, isAuthenticated, applyPresence]);

  const joinDeviceRoom = useCallback((deviceId: string) => {
    socketRef.current?.emit('device:join', { deviceId });
  }, []);

  const leaveDeviceRoom = useCallback((deviceId: string) => {
    socketRef.current?.emit('device:leave', { deviceId });
  }, []);

  const value = useMemo<SocketContextValue>(
    () => ({
      socket: socketRef.current,
      isConnected,
      lastPresenceEvent,
      joinDeviceRoom,
      leaveDeviceRoom,
    }),
    [isConnected, lastPresenceEvent, joinDeviceRoom, leaveDeviceRoom],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
