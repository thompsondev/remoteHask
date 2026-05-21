import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';

import { HealthService } from './health.service';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe' })
  getHealth(): { status: string } {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness probe (PostgreSQL + Redis)' })
  async getReady(): Promise<{ status: string; checks: Record<string, string> }> {
    const result = await this.healthService.getReadiness();

    if (result.status === 'error') {
      throw new ServiceUnavailableException({
        code: 'SERVICE_UNAVAILABLE',
        message: 'One or more dependencies are unavailable',
        checks: result.checks,
      });
    }

    return {
      status: result.status,
      checks: result.checks,
    };
  }
}
