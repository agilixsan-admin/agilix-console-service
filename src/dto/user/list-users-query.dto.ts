import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../types/enums/user-role.enum';

/**
 * ListUsersQueryDto
 *
 * Validates query parameters for GET /users.
 * Source of truth: API_SPEC.md → User Management → List Users
 * Pagination rules: DATABASE_RULES.md § Pagination
 *
 * All fields are optional — defaults applied in UserRepository.findAll().
 * HTTP query strings arrive as strings; @Transform converts them to the
 * correct primitive types before class-validator runs.
 */
export class ListUsersQueryDto {
  /**
   * Page number (1-based).
   * Default: 1 (applied in repository)
   */
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number = 1;

  /**
   * Number of records per page.
   * Default: 10. Maximum: 100 (DATABASE_RULES.md § Pagination)
   */
  @ApiPropertyOptional({
    description: 'Records per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must not exceed 100' })
  limit?: number = 10;

  /**
   * Full-text search string.
   * Matched against fullName and email (case-insensitive ILIKE in repository).
   */
  @ApiPropertyOptional({
    description: 'Search by name or email',
    example: 'john',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'search must be a string' })
  @MaxLength(255, { message: 'search must not exceed 255 characters' })
  search?: string;

  /**
   * Filter by RBAC role.
   */
  @ApiPropertyOptional({
    description: 'Filter by role',
    example: UserRole.VIEWER,
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: `role must be one of: ${Object.values(UserRole).join(', ')}`,
  })
  role?: UserRole;

  /**
   * Filter by active status.
   * Accepts 'true' or 'false' as query string values.
   */
  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isActive must be a boolean (true or false)' })
  isActive?: boolean;
}
