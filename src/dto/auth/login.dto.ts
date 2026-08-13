import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { trim, trimLower } from '../../utils/transform.util';

export class LoginDto {
  @ApiProperty({
    example: 'admin@agilix.com',
    description: 'User email address',
  })
  @IsNotEmpty()
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(255)
  @Transform(({ value }) => trimLower(value))
  email: string;

  @ApiProperty({
    example: 'Admin123!',
    description: 'User password (min 8 characters)',
    minLength: 8,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Transform(({ value }) => trim(value))
  password: string;
}
