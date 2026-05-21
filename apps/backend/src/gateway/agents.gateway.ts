import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ErrorCode } from '@remotehask/shared-types';
import type { AgentHeartbeatAckPayload, AgentHeartbeatPayload } from '@remotehask/shared-types';
import type { Server, Socket } from 'socket.io';

import type { AppConfiguration } from '../config/configuration';
import { DeviceAuthService } from '../modules/devices/services/device-auth.service';
import { DeviceLifecycleService } from '../modules/presence/device-lifecycle.service';

import { createWsEnvelope } from './utils/ws-envelope.util';
import { WsBroadcastService } from './ws-broadcast.service';

interface AgentSocketData {
  deviceId: string;
  organizationId: string;
}

@WebSocketGateway({
  namespace: '/agents',
  cors: { origin: true, credentials: true },
  transports: ['websocket', 'polling'],
})
export class AgentsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AgentsGateway.name);

  constructor(
    private readonly deviceAuthService: DeviceAuthService,
    private readonly lifecycleService: DeviceLifecycleService,
    private readonly configService: ConfigService<AppConfiguration, true>,
    private readonly wsBroadcast: WsBroadcastService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
    try {
      const auth = client.handshake.auth as Record<string, string | undefined>;
      if (auth.clientType !== 'agent') {
        throw new Error('Invalid client type');
      }

      const deviceId = auth.deviceId;
      const token = auth.token;
      if (!deviceId || !token) {
        throw new Error('Missing auth');
      }

      const authenticated = await this.deviceAuthService.authenticateDeviceToken(deviceId, token);

      const data: AgentSocketData = {
        deviceId: authenticated.deviceId,
        organizationId: authenticated.organizationId,
      };
      client.data = data;

      await client.join(this.wsBroadcast.deviceRoom(authenticated.deviceId));
      await client.join(this.wsBroadcast.orgRoom(authenticated.organizationId));

      await this.lifecycleService.onAgentConnected({
        deviceId: authenticated.deviceId,
        organizationId: authenticated.organizationId,
        agentVersion: 'unknown',
        osUser: 'unknown',
        gatewayId: this.configService.get('gateway.instanceId', { infer: true }),
        socketId: client.id,
        ip: client.handshake.address,
      });

      client.emit('connected', {
        socketId: client.id,
        serverTime: new Date().toISOString(),
        rooms: [
          this.wsBroadcast.deviceRoom(authenticated.deviceId),
          this.wsBroadcast.orgRoom(authenticated.organizationId),
        ],
      });

      this.logger.log(`Agent connected device=${authenticated.deviceId}`);
    } catch {
      client.emit('connect_error', { code: ErrorCode.UNAUTHORIZED, message: 'Invalid token' });
      client.disconnect(true);
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket): Promise<void> {
    const data = client.data as AgentSocketData | undefined;
    if (!data?.deviceId) {
      return;
    }

    await this.lifecycleService.onAgentDisconnected({
      deviceId: data.deviceId,
      organizationId: data.organizationId,
    });

    this.logger.log(`Agent disconnected device=${data.deviceId}`);
  }

  @SubscribeMessage('agent:heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: AgentHeartbeatPayload,
  ): Promise<ReturnType<typeof createWsEnvelope<AgentHeartbeatAckPayload>>> {
    const data = client.data as AgentSocketData;

    if (body.deviceId !== data.deviceId) {
      client.disconnect(true);
      return createWsEnvelope({
        nextHeartbeatSeconds: this.lifecycleService.getHeartbeatIntervalSeconds(),
        pendingCommands: [],
      });
    }

    await this.lifecycleService.onHeartbeat({
      deviceId: data.deviceId,
      organizationId: data.organizationId,
      payload: body,
      gatewayId: this.configService.get('gateway.instanceId', { infer: true }),
      socketId: client.id,
      ip: client.handshake.address,
    });

    const ack: AgentHeartbeatAckPayload = {
      nextHeartbeatSeconds: this.lifecycleService.getHeartbeatIntervalSeconds(),
      pendingCommands: [],
    };

    return createWsEnvelope(ack);
  }
}
