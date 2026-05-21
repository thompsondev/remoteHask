import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiPropertyOptional({
    description: 'Required when refresh token is not sent as httpOnly cookie',
  })
  @IsOptional()
  @IsString()
  @MinLength(16)
  refreshToken?: string;
}
