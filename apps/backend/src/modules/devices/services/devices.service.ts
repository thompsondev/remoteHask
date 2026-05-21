import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { DeviceDto } from '@remotehask/shared-types';
import { buildPaginationMeta, decodeCursor, encodeCursor } from '@remotehask/shared-utils';
import { Repository } from 'typeorm';

import { DeviceTag } from '../../../database/entities/device-tag.entity';
import { Device } from '../../../database/entities/device.entity';
import { PresenceStatus } from '../../../database/enums';
import { PresenceService } from '../../presence/presence.service';
import type { ListDevicesQueryDto } from '../dto/list-devices-query.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(DeviceTag)
    private readonly tagRepository: Repository<DeviceTag>,
    private readonly presenceService: PresenceService,
  ) {}

  async listDevices(
    organizationId: string,
    query: ListDevicesQueryDto,
  ): Promise<{ items: DeviceDto[]; pagination: ReturnType<typeof buildPaginationMeta> }> {
    const limit = query.limit ?? 50;

    const qb = this.deviceRepository
      .createQueryBuilder('device')
      .where('device.organization_id = :organizationId', { organizationId })
      .andWhere('device.deleted_at IS NULL');

    if (query.platform) {
      qb.andWhere('device.platform = :platform', { platform: query.platform });
    }

    if (query.q) {
      qb.andWhere('(device.hostname ILIKE :q OR device.friendly_name ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }

    if (query.cursor) {
      const decoded = decodeCursor(query.cursor);
      if (decoded) {
        qb.andWhere(
          '(device.last_seen_at < :cursorDate OR (device.last_seen_at = :cursorDate AND device.id < :cursorId))',
          {
            cursorDate: new Date(decoded.s),
            cursorId: decoded.id,
          },
        );
      }
    }

    qb.orderBy('device.last_seen_at', 'DESC', 'NULLS LAST').addOrderBy('device.id', 'DESC');
    qb.take(limit + 1);

    const devices = await qb.getMany();
    const hasMore = devices.length > limit;
    const page = hasMore ? devices.slice(0, limit) : devices;

    const presenceMap = await this.presenceService.getPresenceForDevices(
      page.map((device) => device.id),
    );

    const tagsByDevice = await this.loadTags(page.map((device) => device.id));

    let items = page.map((device) =>
      this.toDeviceDto(device, presenceMap.get(device.id), tagsByDevice.get(device.id) ?? []),
    );

    if (query.presence) {
      const presenceFilter = query.presence as DeviceDto['presence'];
      items = items.filter((item) => item.presence === presenceFilter);
    }

    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last?.lastSeenAt
        ? encodeCursor({ id: last.id, s: last.lastSeenAt.toISOString() })
        : null;

    return {
      items,
      pagination: buildPaginationMeta({
        limit,
        cursor: query.cursor ?? null,
        nextCursor,
        hasMore,
      }),
    };
  }

  private async loadTags(deviceIds: string[]): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    if (deviceIds.length === 0) {
      return map;
    }

    const tags = await this.tagRepository
      .createQueryBuilder('tag')
      .where('tag.device_id IN (:...deviceIds)', { deviceIds })
      .getMany();

    for (const tag of tags) {
      const existing = map.get(tag.deviceId) ?? [];
      existing.push(tag.tag);
      map.set(tag.deviceId, existing);
    }

    return map;
  }

  private toDeviceDto(
    device: Device,
    live: { status: PresenceStatus; lastSeen: string } | null | undefined,
    tags: string[],
  ): DeviceDto {
    const presence = live?.status ?? device.lastKnownPresence;
    const lastSeenAt = live?.lastSeen ?? device.lastSeenAt?.toISOString() ?? null;

    return {
      id: device.id,
      organizationId: device.organizationId,
      hostname: device.hostname,
      friendlyName: device.friendlyName,
      platform: device.platform,
      osVersion: device.osVersion,
      agentVersion: device.agentVersion,
      registrationStatus: device.registrationStatus,
      presence,
      lastSeenAt,
      lastSeenIp: device.lastSeenIp,
      lastConsoleUser: device.lastConsoleUser,
      unattendedEnabled: device.unattendedEnabled,
      tags,
    };
  }
}
