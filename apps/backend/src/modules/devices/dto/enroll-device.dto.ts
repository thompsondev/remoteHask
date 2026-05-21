import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { DevicePlatform } from '../../../database/enums';

export class EnrollDeviceDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  enrollmentToken!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  hostname!: string;

  @ApiProperty({ enum: DevicePlatform })
  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  osVersion?: string;

  @ApiProperty()
  @IsString()
  @Matches(/^\d+\.\d+\.\d+/)
  agentVersion!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  hardwareInfo?: Record<string, unknown>;
}
