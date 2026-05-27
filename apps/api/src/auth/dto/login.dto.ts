import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'usuario@ejemplo.cl' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'MiClaveSegura123' })
  @IsString()
  @MinLength(8)
  password!: string;
}
