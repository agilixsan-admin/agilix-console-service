import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../types/enums/user-role.enum';

/**
 * CreateUserDto
 *
 * Validates the request body for POST /users.
 * Source of truth: API_SPEC.md → User Management → Create User
 * Validation: AGENTS.md § DTO Rules (class-validator mandatory)
 *
 * All fields are required — partial creation is not allowed.
 * Password is accepted as plaintext here; UserService is responsible
 * for hashing with bcrypt before persisting.
 */
export class CreateUserDto {
  /**
   * Full display name of the administrator.
   * Must be a non-empty string, max 255 characters.
   */
  @IsNotEmpty({ message: 'fullName is required' })
  @IsString({ message: 'fullName must be a string' })
  @MaxLength(255, { message: 'fullName must not exceed 255 characters' })
  fullName: string;

  /**
   * Unique email address used for login.
   * Must be a valid email format.
   */
  @IsNotEmpty({ message: 'email is required' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(255, { message: 'email must not exceed 255 characters' })
  email: string;

  /**
   * Plaintext password submitted by the requester.
   * UserService will hash this with bcrypt before persisting.
   * Min 8 characters enforced here; strength policy can be extended.
   */
  @IsNotEmpty({ message: 'password is required' })
  @IsString({ message: 'password must be a string' })
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(128, { message: 'password must not exceed 128 characters' })
  password: string;

  /**
   * RBAC role to assign to this user.
   * Must be one of the valid UserRole enum values.
   * Source: DOMAIN_MODEL.md → Enums → UserRole
   */
  @IsNotEmpty({ message: 'role is required' })
  @IsEnum(UserRole, {
    message: `role must be one of: ${Object.values(UserRole).join(', ')}`,
  })
  role: UserRole;
}
