import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DevicePresencePayload } from '@remotehask/shared-types';
import type Redis from 'ioredis';

import type { AppConfiguration } from '../../config/configuration';
import { PresenceStatus } from '../../database/enums';
import { REDIS_CHANNELS, REDIS_CLIENT, REDIS_KEYS } from '../../redis/redis.constants';

export interface DevicePresenceRecord {
  status: PresenceStatus;
  lastSeen: string;
  agentVersion?: string;
  osUser?: string;
  gatewayId: string;
  socketId?: string;
}

@Injectable()
export class PresenceService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService<AppConfiguration, true>,
  ) {}

  getTtlSeconds(): number {
    return this.configService.get('gateway.heartbeatTtlSeconds', { infer: true });
  }

  async upsertHeartbeat(params: {
    deviceId: string;
    organizationId: string;
    agentVersion: string;
    osUser: string;
    gatewayId: string;
    socketId: string;
    ip?: string;
  }): Promise<DevicePresencePayload> {
    const now = new Date().toISOString();
    const key = REDIS_KEYS.presenceDevice(params.deviceId);

    await this.redis
      .multi()
      .hset(key, {
        status: PresenceStatus.ONLINE,
        last_seen: now,
        agent_version: params.agentVersion,
        user: params.osUser,
        gateway_id: params.gatewayId,
        socket_id: params.socketId,
        ip: params.ip ?? '',
        organization_id: params.organizationId,
      })
      .expire(key, this.getTtlSeconds())
      .sadd(REDIS_KEYS.presenceOrgOnline(params.organizationId), params.deviceId)
      .set(REDIS_KEYS.deviceConn(params.deviceId), params.gatewayId, 'EX', this.getTtlSeconds())
      .exec();

    return {
      deviceId: params.deviceId,
      organizationId: params.organizationId,
      presence: PresenceStatus.ONLINE,
      lastSeenAt: now,
      agentVersion: params.agentVersion,
      lastConsoleUser: params.osUser,
    };
  }

  async getPresence(deviceId: string): Promise<PresenceStatus> {
    const raw = await this.redis.hget(REDIS_KEYS.presenceDevice(deviceId), 'status');
    if (!raw) {
      return PresenceStatus.OFFLINE;
    }
    return raw as PresenceStatus;
  }

  async getPresenceForDevices(
    deviceIds: string[],
  ): Promise<Map<string, DevicePresenceRecord | null>> {
    const map = new Map<string, DevicePresenceRecord | null>();

    await Promise.all(
      deviceIds.map(async (deviceId) => {
        const data = await this.redis.hgetall(REDIS_KEYS.presenceDevice(deviceId));
        if (!data.status) {
          map.set(deviceId, null);
          return;
        }
        map.set(deviceId, {
          status: data.status as PresenceStatus,
          lastSeen: data.last_seen ?? new Date().toISOString(),
          agentVersion: data.agent_version,
          osUser: data.user,
          gatewayId: data.gateway_id ?? '',
          socketId: data.socket_id,
        });
      }),
    );

    return map;
  }

  async markOffline(params: {
    deviceId: string;
    organizationId: string;
    status?: PresenceStatus;
  }): Promise<DevicePresencePayload> {
    const status = params.status ?? PresenceStatus.OFFLINE;
    const now = new Date().toISOString();
    const key = REDIS_KEYS.presenceDevice(params.deviceId);

    const exists = await this.redis.exists(key);
    if (exists) {
      await this.redis.hset(key, { status, last_seen: now });
      await this.redis.expire(key, this.getTtlSeconds());
    }

    if (status === PresenceStatus.OFFLINE) {
      await this.redis.srem(REDIS_KEYS.presenceOrgOnline(params.organizationId), params.deviceId);
      await this.redis.del(REDIS_KEYS.deviceConn(params.deviceId));
    }

    return {
      deviceId: params.deviceId,
      organizationId: params.organizationId,
      presence: status,
      lastSeenAt: now,
    };
  }

  async publishPresenceChange(payload: DevicePresencePayload): Promise<void> {
    await this.redis.publish(REDIS_CHANNELS.presenceChange, JSON.stringify(payload));
  }
}
