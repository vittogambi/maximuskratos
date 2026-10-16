import { IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitResponseDto {
  @IsString()
  questionId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptionIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  freeText?: string;

  @IsOptional()
  @IsIn(['UNKNOWN', 'NOT_APPLICABLE', 'DECLINED', 'PENDING'])
  exceptionKind?: 'UNKNOWN' | 'NOT_APPLICABLE' | 'DECLINED' | 'PENDING';

  @IsOptional()
  @IsInt()
  expectedRevision?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rankingOrder?: string[];

  @IsOptional()
  @IsNumber()
  latencyMs?: number;

  @IsOptional()
  @IsNumber()
  editCount?: number;
}
