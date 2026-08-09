import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BaseController } from '../../base-controller';
import { UserService } from '../../../service/modules/users/user.service';
import { CreateUserDto } from '../../../dto/user/create-user.dto';
import { UpdateUserDto } from '../../../dto/user/update-user.dto';
import { ListUsersQueryDto } from '../../../dto/user/list-users-query.dto';
import { ApiResponse, PaginatedResult } from '../../../types/response.types';
import { User } from '../../../models/user.model';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { UserRole } from '../../../types/enums/user-role.enum';

/**
 * UserController
 *
 * Handles HTTP requests for the User Management domain.
 * Source of truth: API_SPEC.md → User Management
 * RBAC:            RBAC_MATRIX.md → User Management (SUPER_ADMIN only)
 *
 * Layer contract (ARCHITECTURE_RULES.md):
 *   Request → Route → Controller → UserService → UserRepository → DB
 *
 * Controller responsibilities (ARCHITECTURE_RULES.md § Controller Rules):
 *   ✓ Receive and validate the request (via DTOs + ValidationPipe)
 *   ✓ Call UserService
 *   ✓ Return a formatted response via BaseController helpers
 *
 * FORBIDDEN in this class:
 *   ✗ Business logic
 *   ✗ Database calls
 *   ✗ Direct repository access
 *   ✗ Role checks (if user.role === ...) — handled by guards in Phase 2
 *
 * Authentication / Authorization status:
 *   Guards (JwtAuthGuard + RolesGuard) and @Roles() decorator will be applied
 *   when the Auth module is implemented in Phase 1.3. Placeholder comments
 *   mark every endpoint's required role for immediate reference.
 *
 * Base path: /users
 * Registered under /api/v1/users via global prefix in main.ts (Phase 1.1)
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class UserController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }

  // ---------------------------------------------------------------------------
  // GET /users
  // ---------------------------------------------------------------------------

  /**
   * List all users with pagination and optional filters.
   *
   * RBAC:   SUPER_ADMIN only   (RBAC_MATRIX.md § User Management)
   * Guard:  @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(UserRole.SUPER_ADMIN)
   *         — will be added in Phase 1.3
   *
   * Query params: page, limit, search, role, isActive
   * Response shape: ApiResponse<PaginatedResult<User>>
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: ListUsersQueryDto,
  ): Promise<ApiResponse<PaginatedResult<User>>> {
    const result = await this.userService.findAll(query);
    return this.paginated(result, 'Users retrieved successfully');
  }

  // ---------------------------------------------------------------------------
  // GET /users/:id
  // ---------------------------------------------------------------------------

  /**
   * Get a single user by UUID.
   *
   * RBAC:   SUPER_ADMIN only
   * Guard:  @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(UserRole.SUPER_ADMIN)
   *
   * ParseUUIDPipe validates that :id is a valid UUID v4 before the handler runs.
   * Returns 400 Bad Request for malformed UUIDs, 404 Not Found for missing records.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ApiResponse<User>> {
    const user = await this.userService.findById(id);
    return this.success(user, 'User retrieved successfully');
  }

  // ---------------------------------------------------------------------------
  // POST /users
  // ---------------------------------------------------------------------------

  /**
   * Create a new user account.
   *
   * RBAC:   SUPER_ADMIN only
   * Guard:  @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(UserRole.SUPER_ADMIN)
   *
   * Returns 201 Created on success.
   * Returns 409 Conflict if the email is already in use.
   * DTO validation is handled by the global ValidationPipe in main.ts.
   *
   * Audit Log: CREATE_USER — will be wired to AuditLogService in Phase 2.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto): Promise<ApiResponse<User>> {
    const user = await this.userService.create(dto);
    return this.success(user, 'User created successfully');
  }

  // ---------------------------------------------------------------------------
  // PATCH /users/:id
  // ---------------------------------------------------------------------------

  /**
   * Update mutable fields on an existing user.
   *
   * RBAC:   SUPER_ADMIN only
   * Guard:  @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(UserRole.SUPER_ADMIN)
   *
   * Updatable fields: fullName, role
   * Non-updatable via this endpoint: email, password, isActive
   *
   * Audit Log: UPDATE_USER — will be wired to AuditLogService in Phase 2.
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<ApiResponse<User>> {
    const user = await this.userService.update(id, dto);
    return this.success(user, 'User updated successfully');
  }

  // ---------------------------------------------------------------------------
  // PATCH /users/:id/deactivate
  // ---------------------------------------------------------------------------

  /**
   * Deactivate a user account (sets isActive = false).
   *
   * RBAC:   SUPER_ADMIN only
   * Guard:  @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(UserRole.SUPER_ADMIN)
   *
   * Domain invariant: Deactivated users cannot log in.
   * (DOMAIN_MODEL.md § Domain Invariants → User)
   *
   * This is a logical disable — the record is NOT soft-deleted.
   * Audit Log: DISABLE_USER — will be wired to AuditLogService in Phase 2.
   */
  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivate(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ApiResponse<User>> {
    const user = await this.userService.deactivate(id);
    return this.success(user, 'User deactivated successfully');
  }

  // ---------------------------------------------------------------------------
  // DELETE /users/:id
  // ---------------------------------------------------------------------------

  /**
   * Soft-delete a user record.
   *
   * RBAC:   SUPER_ADMIN only
   * Guard:  @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(UserRole.SUPER_ADMIN)
   *
   * Soft delete sets deleted_at; the record remains in the database.
   * Soft delete policy: DOMAIN_MODEL.md § Soft Delete Policy
   *
   * Audit Log: DELETE_USER — will be wired to AuditLogService in Phase 2.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ApiResponse<void>> {
    await this.userService.remove(id);
    return this.noContent('User deleted successfully');
  }
}
