import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RefreshDto {
  @ApiPropertyOptional({ description: 'Refresh token. Required for ios/android; web may use the cookie' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  refreshToken?: string;
}
