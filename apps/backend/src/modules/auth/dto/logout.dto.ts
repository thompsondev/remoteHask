import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allDevices?: boolean;
}
