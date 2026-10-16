import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({ description: 'Refresh token. Required for ios/android; web uses the cookie' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  refreshToken?: string;
}
