import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { UserRole } from '../../types/enums/user-role.enum';

/**
 * UpdateUserDto
 *
 * Validates the request body for PATCH /users/:id.
 * Source of truth: API_SPEC.md → User Management → Update User
 *
 * All fields are optional — only provided fields are updated.
 * email and password are intentionally excluded:
 *   - Email changes require a separate verification flow (not in scope for v1).
 *   - Password changes must go through a dedicated change-password endpoint.
 *
 * isActive is also excluded here — use PATCH /users/:id/deactivate
 * for explicit deactivation (DeactivateUserDto).
 */
export class UpdateUserDto {
  /**
   * Updated full display name.
   */
  @ApiProperty({
    description: 'Updated full display name of the user',
    example: 'Jane Doe',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'fullName must be a string' })
  @MaxLength(255, { message: 'fullName must not exceed 255 characters' })
  fullName?: string;

  /**
   * Updated RBAC role.
   * Only SUPER_ADMIN may change roles (enforced at controller/guard level).
   */
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
