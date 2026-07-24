import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdatePlanDto {
  @ApiPropertyOptional({ example: 'Mensual' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @ApiPropertyOptional({ example: 1, enum: [1, 3, 6, 12] })
  @IsOptional()
  @IsIn([1, 3, 6, 12])
  periodMonths?: number;

  @ApiPropertyOptional({ example: 29990 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceAmount?: number;

  @ApiPropertyOptional({ example: 'CLP' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(280)
  conditions?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  trialDaysOverride?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoRenews?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  providerId?: string;
}
