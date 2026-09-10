import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'OldSecretPass123!',
    description: 'Password lama milik user yang sedang login',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    example: 'NewSecretPass123!',
    description: 'Password baru minimal 8 karakter',
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'newPassword must be at least 8 characters long' })
  @MaxLength(100, { message: 'newPassword must not exceed 100 characters' })
  newPassword: string;
}

