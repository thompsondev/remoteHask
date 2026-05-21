import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsUUID, Length, Matches } from 'class-validator';

export class MfaVerifyDto {
  @ApiProperty()
  @IsUUID()
  mfaChallengeId!: string;

  @ApiProperty({ enum: ['totp', 'webauthn'] })
  @IsIn(['totp', 'webauthn'])
  method!: 'totp' | 'webauthn';

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;
}
