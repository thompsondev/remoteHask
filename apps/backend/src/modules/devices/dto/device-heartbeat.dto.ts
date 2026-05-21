import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, Matches } from 'class-validator';

export class DeviceHeartbeatDto {
  @ApiProperty()
  @IsString()
  @Matches(/^\d+\.\d+\.\d+/)
  agentVersion!: string;

  @ApiProperty()
  @IsString()
  osUser!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metrics?: { cpuPercent?: number; memoryMb?: number };
}
