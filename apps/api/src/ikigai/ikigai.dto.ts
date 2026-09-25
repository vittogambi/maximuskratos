import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class IkigaiSourceDto {
  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  referrer_host?: string;

  @IsOptional()
  @IsString()
  utm_source?: string;

  @IsOptional()
  @IsString()
  utm_medium?: string;

  @IsOptional()
  @IsString()
  utm_campaign?: string;

  @IsOptional()
  @IsIn(['mobile', 'desktop'])
  device?: 'mobile' | 'desktop';
}

export class CreateIkigaiSessionDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => IkigaiSourceDto)
  source?: IkigaiSourceDto;
}

export class PatchIkigaiDraftDto {
  @IsInt()
  @Type(() => Number)
  draftVersion!: number;

  @IsString()
  definitionSha256!: string;

  @IsOptional()
  @IsString()
  step?: string;

  @IsObject()
  patch!: Record<string, unknown>;
}

export class SessionWriteDto {
  @IsInt()
  @Type(() => Number)
  draftVersion!: number;

  @IsString()
  definitionSha256!: string;
}

export class NextExperimentDto {
  @IsInt()
  @Type(() => Number)
  draftVersion!: number;

  @IsString()
  definitionSha256!: string;

  @IsOptional()
  @IsString()
  hypothesisId!: string | null;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  focus!: string;

  @IsIn([30, 60, 90])
  @Type(() => Number)
  horizonDays!: 30 | 60 | 90;

  @IsString()
  @MinLength(1)
  @MaxLength(280)
  action!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  signal!: string;
}
