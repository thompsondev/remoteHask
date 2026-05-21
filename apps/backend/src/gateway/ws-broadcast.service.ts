import { Injectable } from '@nestjs/common';
import type { DevicePresencePayload, WsEventEnvelope } from '@remotehask/shared-types';
import type { Namespace } from 'socket.io';

@Injectable()
export class WsBroadcastService {
  private consoleNamespace: Namespace | null = null;

  setConsoleNamespace(namespace: Namespace): void {
    this.consoleNamespace = namespace;
  }

  broadcastPresence(
    organizationId: string,
    envelope: WsEventEnvelope<DevicePresencePayload>,
  ): void {
    this.consoleNamespace?.to(this.orgRoom(organizationId)).emit('device:presence', envelope);
  }

  orgRoom(organizationId: string): string {
    return `org:${organizationId}`;
  }

  deviceRoom(deviceId: string): string {
    return `device:${deviceId}`;
  }
}
