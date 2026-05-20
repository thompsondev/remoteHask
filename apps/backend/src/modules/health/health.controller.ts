import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  getReady(): { status: string; checks: Record<string, string> } {
    return {
      status: 'ok',
      checks: {
        postgres: 'pending',
        redis: 'pending',
      },
    };
  }
}
