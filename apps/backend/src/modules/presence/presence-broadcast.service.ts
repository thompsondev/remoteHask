import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { DevicePresencePayload, WsEventEnvelope } from '@remotehask/shared-types';
import type Redis from 'ioredis';

import { createWsEnvelope } from '../../gateway/utils/ws-envelope.util';
import { WsBroadcastService } from '../../gateway/ws-broadcast.service';
import { REDIS_CHANNELS, REDIS_SUBSCRIBER } from '../../redis/redis.constants';

@Injectable()
export class PresenceBroadcastService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PresenceBroadcastService.name);

  constructor(
    @Inject(REDIS_SUBSCRIBER) private readonly subscriber: Redis,
    private readonly wsBroadcast: WsBroadcastService,
  ) {}

  onModuleInit(): void {
    void this.subscriber.subscribe(REDIS_CHANNELS.presenceChange).catch((error: unknown) => {
      this.logger.error('Failed to subscribe to presence channel', String(error));
    });

    this.subscriber.on('message', (channel, message) => {
      if (channel !== REDIS_CHANNELS.presenceChange) {
        return;
      }

      try {
        const payload = JSON.parse(message) as DevicePresencePayload;
        const envelope: WsEventEnvelope<DevicePresencePayload> = createWsEnvelope(payload);
        this.wsBroadcast.broadcastPresence(payload.organizationId, envelope);
      } catch (error) {
        this.logger.error('Invalid presence pub/sub payload', String(error));
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.subscriber.unsubscribe(REDIS_CHANNELS.presenceChange);
    } catch {
      // Connection may already be closed during app shutdown
    }
  }
}
