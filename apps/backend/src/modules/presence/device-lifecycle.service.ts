import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { AgentHeartbeatPayload, DevicePresencePayload } from '@remotehask/shared-types';
import { IsNull, Repository } from 'typeorm';

import type { AppConfiguration } from '../../config/configuration';
import { Device } from '../../database/entities/device.entity';
import { DeviceRegistrationStatus, PresenceStatus } from '../../database/enums';

import { PresenceService } from './presence.service';

interface PersistState {
  lastPersistAt: number;
  lastPresence: PresenceStatus | null;
}

@Injectable()
export class DeviceLifecycleService {
  private readonly logger = new Logger(DeviceLifecycleService.name);
  private readonly persistState = new Map<string, PersistState>();
  private readonly dbPersistIntervalMs = 5 * 60_000;

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    private readonly presenceService: PresenceService,
    private readonly configService: ConfigService<AppConfiguration, true>,
  ) {}

  getHeartbeatIntervalSeconds(): number {
    return this.configService.get('gateway.heartbeatIntervalSeconds', { infer: true });
  }

  async onAgentConnected(params: {
    deviceId: string;
    organizationId: string;
    agentVersion: string;
    osUser: string;
    gatewayId: string;
    socketId: string;
    ip?: string;
  }): Promise<DevicePresencePayload> {
    const payload = await this.presenceService.upsertHeartbeat(params);
    await this.persistDeviceState(params.deviceId, payload, true);
    await this.presenceService.publishPresenceChange(payload);
    return payload;
  }

  async onAgentDisconnected(params: {
    deviceId: string;
    organizationId: string;
  }): Promise<DevicePresencePayload> {
    const stalePayload = await this.presenceService.markOffline({
      deviceId: params.deviceId,
      organizationId: params.organizationId,
      status: PresenceStatus.STALE,
    });
    await this.persistDeviceState(params.deviceId, stalePayload, true);
    await this.presenceService.publishPresenceChange(stalePayload);

    const graceSeconds = this.configService.get('gateway.presenceStaleGraceSeconds', {
      infer: true,
    });

    setTimeout(() => {
      void (async () => {
        const current = await this.presenceService.getPresence(params.deviceId);
        if (current !== PresenceStatus.STALE) {
          return;
        }
        const offlinePayload = await this.presenceService.markOffline({
          deviceId: params.deviceId,
          organizationId: params.organizationId,
          status: PresenceStatus.OFFLINE,
        });
        await this.persistDeviceState(params.deviceId, offlinePayload, true);
        await this.presenceService.publishPresenceChange(offlinePayload);
      })();
    }, graceSeconds * 1000);

    return stalePayload;
  }

  async onHeartbeat(params: {
    deviceId: string;
    organizationId: string;
    payload: AgentHeartbeatPayload;
    gatewayId: string;
    socketId: string;
    ip?: string;
  }): Promise<DevicePresencePayload> {
    const presencePayload = await this.presenceService.upsertHeartbeat({
      deviceId: params.deviceId,
      organizationId: params.organizationId,
      agentVersion: params.payload.agentVersion,
      osUser: params.payload.osUser,
      gatewayId: params.gatewayId,
      socketId: params.socketId,
      ip: params.ip,
    });

    await this.updateDeviceMetadata(params.deviceId, params.payload);
    await this.persistDeviceState(params.deviceId, presencePayload, false);
    await this.presenceService.publishPresenceChange(presencePayload);

    return presencePayload;
  }

  async onHttpHeartbeat(params: {
    deviceId: string;
    organizationId: string;
    agentVersion: string;
    osUser: string;
    metrics?: AgentHeartbeatPayload['metrics'];
    ip?: string;
  }): Promise<DevicePresencePayload> {
    return this.onHeartbeat({
      deviceId: params.deviceId,
      organizationId: params.organizationId,
      payload: {
        deviceId: params.deviceId,
        agentVersion: params.agentVersion,
        osUser: params.osUser,
        metrics: params.metrics,
      },
      gatewayId: this.configService.get('gateway.instanceId', { infer: true }),
      socketId: 'http',
      ip: params.ip,
    });
  }

  private async updateDeviceMetadata(
    deviceId: string,
    payload: AgentHeartbeatPayload,
  ): Promise<void> {
    await this.deviceRepository.update(
      { id: deviceId, deletedAt: IsNull() },
      {
        agentVersion: payload.agentVersion,
        lastConsoleUser: payload.osUser,
        registrationStatus: DeviceRegistrationStatus.ACTIVE,
      },
    );
  }

  private async persistDeviceState(
    deviceId: string,
    payload: DevicePresencePayload,
    force: boolean,
  ): Promise<void> {
    const now = Date.now();
    const state = this.persistState.get(deviceId);
    const presenceChanged = state?.lastPresence !== (payload.presence as PresenceStatus);

    if (
      !force &&
      state &&
      now - state.lastPersistAt < this.dbPersistIntervalMs &&
      !presenceChanged
    ) {
      return;
    }

    await this.deviceRepository.update(
      { id: deviceId, deletedAt: IsNull() },
      {
        lastKnownPresence: payload.presence as PresenceStatus,
        lastSeenAt: new Date(payload.lastSeenAt),
      },
    );

    this.persistState.set(deviceId, {
      lastPersistAt: now,
      lastPresence: payload.presence as PresenceStatus,
    });
  }

  sweepExpiredPresence(): void {
    this.logger.debug('Presence sweep tick');
  }
}
