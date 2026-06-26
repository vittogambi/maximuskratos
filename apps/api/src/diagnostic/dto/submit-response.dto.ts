import { IsArray, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitResponseDto {
  @IsString()
  questionId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptionIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  freeText?: string;

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
