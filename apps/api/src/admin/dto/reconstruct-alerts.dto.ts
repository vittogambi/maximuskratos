import { IsBoolean, IsUUID } from 'class-validator';

export class ReconstructAlertsDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  sessionId!: string;

  @IsBoolean()
  execute!: boolean;
}
