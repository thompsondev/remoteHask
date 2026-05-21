import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ErrorCode } from '@remotehask/shared-types';
import type { DevicePresencePayload, WsEventEnvelope } from '@remotehask/shared-types';
import type { Namespace, Socket } from 'socket.io';

import type { AppConfiguration } from '../config/configuration';
import type { JwtAccessPayload } from '../modules/auth/interfaces/jwt-payload.interface';
import { RbacService } from '../modules/auth/services/rbac.service';

import { WsBroadcastService } from './ws-broadcast.service';

interface ConsoleSocketData {
  userId: string;
  organizationId: string | null;
}

@WebSocketGateway({
  namespace: '/console',
  cors: { origin: true, credentials: true },
  transports: ['websocket', 'polling'],
})
export class ConsoleGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Namespace;

  private readonly logger = new Logger(ConsoleGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly rbacService: RbacService,
    private readonly configService: ConfigService<AppConfiguration, true>,
    private readonly wsBroadcast: WsBroadcastService,
  ) {}

  afterInit(server: Namespace): void {
    this.wsBroadcast.setConsoleNamespace(server);
  }

  async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
    try {
      const auth = client.handshake.auth as Record<string, string | undefined>;
      if (auth.clientType !== 'console') {
        throw new Error('Invalid client type');
      }

      const token = auth.token;
      const organizationId = auth.organizationId;
      if (!token || !organizationId) {
        throw new Error('Missing auth');
      }

      const payload = this.jwtService.verify<JwtAccessPayload>(token, {
        secret: this.configService.get('jwt.secret', { infer: true }),
      });

      const membership = await this.rbacService.getMembership(payload.sub, organizationId);
      if (!membership) {
        throw new Error('Org access denied');
      }

      const data: ConsoleSocketData = { userId: payload.sub, organizationId };
      client.data = data;
      await client.join(this.wsBroadcast.orgRoom(organizationId));

      client.emit('connected', {
        socketId: client.id,
        serverTime: new Date().toISOString(),
        rooms: [this.wsBroadcast.orgRoom(organizationId)],
      });
    } catch {
      client.emit('connect_error', { code: ErrorCode.UNAUTHORIZED, message: 'Invalid token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket): void {
    this.logger.debug(`Console client disconnected: ${client.id}`);
  }

  @SubscribeMessage('org:join')
  async handleOrgJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { organizationId: string },
  ): Promise<{ ok: boolean; room: string }> {
    const data = client.data as ConsoleSocketData;
    const membership = await this.rbacService.getMembership(data.userId, body.organizationId);
    if (!membership) {
      return { ok: false, room: '' };
    }

    await client.join(this.wsBroadcast.orgRoom(body.organizationId));
    return { ok: true, room: this.wsBroadcast.orgRoom(body.organizationId) };
  }

  @SubscribeMessage('device:join')
  async handleDeviceJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { deviceId: string },
  ): Promise<{ ok: boolean; room: string }> {
    const room = this.wsBroadcast.deviceRoom(body.deviceId);
    await client.join(room);
    return { ok: true, room };
  }

  @SubscribeMessage('device:leave')
  async handleDeviceLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { deviceId: string },
  ): Promise<{ ok: boolean; room: string }> {
    const room = this.wsBroadcast.deviceRoom(body.deviceId);
    await client.leave(room);
    return { ok: true, room };
  }

  broadcastPresence(
    organizationId: string,
    envelope: WsEventEnvelope<DevicePresencePayload>,
  ): void {
    this.wsBroadcast.broadcastPresence(organizationId, envelope);
  }
}
