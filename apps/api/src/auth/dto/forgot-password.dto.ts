import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@ejemplo.cl' })
  @IsEmail()
  email!: string;
}
