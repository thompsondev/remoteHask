import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AgentEnrollResponseDto, DeviceDto } from '@remotehask/shared-types';
import type { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { DeviceLifecycleService } from '../presence/device-lifecycle.service';

import { DeviceHeartbeatDto } from './dto/device-heartbeat.dto';
import { EnrollDeviceDto } from './dto/enroll-device.dto';
import { ListDevicesQueryDto } from './dto/list-devices-query.dto';
import { DeviceAuthGuard } from './guards/device-auth.guard';
import type { AuthenticatedDevice } from './services/device-auth.service';
import { DevicesService } from './services/devices.service';
import { EnrollmentService } from './services/enrollment.service';

@ApiTags('devices')
@Controller()
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly enrollmentService: EnrollmentService,
    private readonly lifecycleService: DeviceLifecycleService,
  ) {}

  @Public()
  @Post('devices/enroll')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agent first-time registration' })
  @ApiCreatedResponse({ description: 'Device enrolled; returns one-time device token' })
  async enroll(@Body() dto: EnrollDeviceDto): Promise<AgentEnrollResponseDto> {
    return this.enrollmentService.enroll(dto);
  }

  @Public()
  @UseGuards(DeviceAuthGuard)
  @Post('devices/heartbeat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'HTTP fallback heartbeat' })
  @ApiHeader({ name: 'X-Device-Id', required: true })
  @ApiBearerAuth()
  async heartbeat(
    @Body() dto: DeviceHeartbeatDto,
    @Req() req: Request & { device?: AuthenticatedDevice },
  ): Promise<{ acknowledged: boolean; nextHeartbeatSeconds: number; pendingCommands: unknown[] }> {
    const device = req.device;
    if (!device) {
      throw new Error('Device context missing');
    }

    await this.lifecycleService.onHttpHeartbeat({
      deviceId: device.deviceId,
      organizationId: device.organizationId,
      agentVersion: dto.agentVersion,
      osUser: dto.osUser,
      metrics: dto.metrics,
      ip: req.ip,
    });

    return {
      acknowledged: true,
      nextHeartbeatSeconds: this.lifecycleService.getHeartbeatIntervalSeconds(),
      pendingCommands: [],
    };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(OrganizationGuard)
  @Get('organizations/current/devices')
  @ApiOperation({ summary: 'List devices with live presence' })
  @ApiOkResponse({ description: 'Device inventory merged with Redis presence' })
  @ApiHeader({ name: 'X-Organization-Id', required: true })
  async listDevices(
    @Headers('x-organization-id') organizationId: string,
    @Query() query: ListDevicesQueryDto,
  ): Promise<{ items: DeviceDto[] }> {
    const result = await this.devicesService.listDevices(organizationId, query);
    return { items: result.items };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(OrganizationGuard)
  @Permissions('device.manage')
  @Post('organizations/current/enrollment-tokens')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create one-time enrollment token' })
  async createEnrollmentToken(
    @Headers('x-organization-id') organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ enrollmentToken: string; tokenId: string; expiresAt: string }> {
    return this.enrollmentService.createEnrollmentToken({
      organizationId,
      createdByUserId: user.userId,
    });
  }
}
