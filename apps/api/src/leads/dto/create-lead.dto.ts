import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({ example: 'interesado@ejemplo.cl' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'Rafael Novoa' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Me interesa conocer la metodología.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @ApiPropertyOptional({ example: 'contact' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string;
}
