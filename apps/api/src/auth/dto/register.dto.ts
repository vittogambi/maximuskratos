import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@ejemplo.cl' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'MiClaveSegura123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
