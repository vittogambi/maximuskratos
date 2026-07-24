import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({ example: 'mensual' })
  @IsString()
  @MaxLength(32)
  code!: string;

  @ApiProperty({ example: 'Mensual' })
  @IsString()
  @MaxLength(64)
  name!: string;

  @ApiProperty({ example: 1, enum: [1, 3, 6, 12] })
  @IsIn([1, 3, 6, 12])
  periodMonths!: number;

  @ApiProperty({ example: 29990, description: 'Precio total del período, en la unidad mínima de la moneda' })
  @IsInt()
  @Min(0)
  priceAmount!: number;

  @ApiPropertyOptional({ example: 'CLP', default: 'CLP' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiPropertyOptional({ example: 15, description: 'Descuento vs. pagar mes a mes, en %' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPct?: number;

  @ApiPropertyOptional({ example: 'Renovación automática, cancela cuando quieras.' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  conditions?: string;

  @ApiPropertyOptional({ type: [String], example: ['Diagnóstico completo', 'Perfil Maestro MK'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: 'Más popular' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  highlightLabel?: string;

  @ApiPropertyOptional({ example: 'Ahorra 2 meses' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  promoText?: string;

  @ApiPropertyOptional({ description: 'Sobrescribe el período de prueba global (días) solo para este plan' })
  @IsOptional()
  @IsInt()
  @Min(0)
  trialDaysOverride?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoRenews?: boolean;

  @ApiPropertyOptional({ description: 'ID del plan/precio en el proveedor de pagos (MercadoPago), cuando exista' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  providerId?: string;
}
