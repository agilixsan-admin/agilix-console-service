import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../types/enums/user-role.enum';
import { trim, trimLower } from '../../utils/transform.util';

export class CreateUserDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'fullName is required' })
  @IsString({ message: 'fullName must be a string' })
  @MaxLength(255, { message: 'fullName must not exceed 255 characters' })
  @Transform(({ value }) => trim(value))
  fullName: string;

  @ApiProperty({
    description: 'Unique email address for login',
    example: 'john@example.com',
    format: 'email',
  })
  @IsNotEmpty({ message: 'email is required' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(255, { message: 'email must not exceed 255 characters' })
  @Transform(({ value }) => trimLower(value))
  email: string;

  @ApiProperty({
    description: 'Password (minimum 8 characters)',
    example: 'Password123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsNotEmpty({ message: 'password is required' })
  @IsString({ message: 'password must be a string' })
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(128, { message: 'password must not exceed 128 characters' })
  @Transform(({ value }) => trim(value))
  password: string;

  @ApiProperty({
    description: 'User role',
    example: UserRole.VIEWER,
    enum: UserRole,
  })
  @IsNotEmpty({ message: 'role is required' })
  @IsEnum(UserRole, {
    message: `role must be one of: ${Object.values(UserRole).join(', ')}`,
  })
  role: UserRole;
}
