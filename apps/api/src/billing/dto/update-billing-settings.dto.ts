import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateBillingSettingsDto {
  @ApiPropertyOptional({ example: 30, description: 'Días de período de prueba por defecto para nuevos registros' })
  @IsOptional()
  @IsInt()
  @Min(0)
  trialDays?: number;
}
