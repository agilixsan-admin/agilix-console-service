import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../types/enums/user-role.enum';
import { trim } from '../../utils/transform.util';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Updated full display name of the user',
    example: 'Jane Doe',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'fullName must be a string' })
  @MaxLength(255, { message: 'fullName must not exceed 255 characters' })
  @Transform(({ value }) => trim(value))
  fullName?: string;

  @ApiProperty({
    description: 'Updated RBAC role assigned to the user',
    example: UserRole.SUPPORT_ADMIN,
    enum: UserRole,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: `role must be one of: ${Object.values(UserRole).join(', ')}`,
  })
  role?: UserRole;
}
