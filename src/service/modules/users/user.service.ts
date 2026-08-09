import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../../../models/user.model';
import {
  FindAllUsersOptions,
  UserRepository,
} from '../../../repositories/modules/user.repository';
import { PaginatedResult } from '../../../types/response.types';
import { CreateUserDto } from '../../../dto/user/create-user.dto';
import { UpdateUserDto } from '../../../dto/user/update-user.dto';
import { ListUsersQueryDto } from '../../../dto/user/list-users-query.dto';

/**
 * UserService
 *
 * Owns all business logic for the User domain.
 * Source of truth:
 *   - ARCHITECTURE_RULES.md  → Service Responsibilities
 *   - DOMAIN_MODEL.md        → Entity: User, Domain Invariants
 *   - API_SPEC.md            → User Management
 *   - RBAC_MATRIX.md         → User Management permissions
 *
 * Layer contract:
 *   Controller → UserService → UserRepository → TypeORM
 *
 * FORBIDDEN in this class:
 *   ✗ Direct TypeORM / database calls
 *   ✗ HTTP request / response handling
 *   ✗ Role hardcoding: if (user.role === 'SUPER_ADMIN') — all authorization
 *     must flow through Guards and Decorators (RBAC_MATRIX.md § Forbidden Rules)
 *
 * Audit Log readiness:
 *   Methods that mutate data accept an optional `actorId` parameter so that
 *   when AuditLogService is wired in Phase 2, calls can be added without
 *   changing signatures.
 */
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  // ---------------------------------------------------------------------------
  // Read operations
  // ---------------------------------------------------------------------------

  /**
   * Returns a paginated list of users.
   * Delegates filtering and pagination entirely to UserRepository.
   * API_SPEC.md → GET /users
   */
  async findAll(query: ListUsersQueryDto): Promise<PaginatedResult<User>> {
    const options: FindAllUsersOptions = {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
      role: query.role,
      isActive: query.isActive,
    };

    return this.userRepository.findAll(options);
  }

  /**
   * Returns a single user by ID.
   * Throws NotFoundException if the user does not exist or is soft-deleted.
   * API_SPEC.md → GET /users/:id
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    return user;
  }

  // ---------------------------------------------------------------------------
  // Write operations
  // ---------------------------------------------------------------------------

  /**
   * Creates a new user account.
   *
   * Business rules enforced:
   *   1. email must be unique → throws ConflictException if taken
   *   2. password is hashed with bcrypt before persisting
   *      (DOMAIN_MODEL.md § Domain Invariants → User)
   *
   * Audit log hook:
   *   AuditLog for CREATE_USER will be written here once AuditLogService
   *   is available (Phase 2). The actorId parameter is reserved for that.
   *
   * API_SPEC.md → POST /users
   */
  async create(dto: CreateUserDto): Promise<User> {
    // 1. Enforce email uniqueness
    const existing = await this.userRepository.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException(
        `A user with email "${dto.email}" already exists`,
      );
    }

    // 2. Hash password — NEVER store plaintext
    const saltRounds = this.configService.get<number>('bcrypt.saltRounds') ?? 12;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // 3. Persist
    const user = await this.userRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      role: dto.role,
      isActive: true,
    });

    return user;
  }

  /**
   * Updates mutable fields on an existing user.
   *
   * Only fullName and role can be changed via this method.
   * Email changes and password changes require dedicated flows.
   *
   * Throws NotFoundException if the user does not exist.
   *
   * API_SPEC.md → PATCH /users/:id
   */
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    // Verify existence before mutating
    await this.findById(id);

    const updatedUser = await this.userRepository.update(id, {
      ...(dto.fullName !== undefined && { fullName: dto.fullName }),
      ...(dto.role !== undefined && { role: dto.role }),
    });

    return updatedUser;
  }

  /**
   * Deactivates a user account (sets isActive = false).
   *
   * Business rules:
   *   - Deactivated users cannot log in
   *     (DOMAIN_MODEL.md § Domain Invariants → User: "User nonaktif tidak dapat login")
   *   - This is a logical disable — the record is NOT deleted
   *   - Use softDelete() for hard removal when required
   *
   * Throws NotFoundException if the user does not exist.
   * API_SPEC.md → PATCH /users/:id/deactivate
   */
  async deactivate(id: string): Promise<User> {
    await this.findById(id);

    const deactivatedUser = await this.userRepository.update(id, {
      isActive: false,
    });

    return deactivatedUser;
  }

  /**
   * Soft-deletes a user record.
   *
   * Sets deleted_at to the current timestamp.
   * TypeORM will automatically exclude this record from all future queries.
   * Soft delete policy: DOMAIN_MODEL.md § Soft Delete Policy
   *
   * Throws NotFoundException if the user does not exist.
   * API_SPEC.md → DELETE /users/:id (RBAC_MATRIX.md: SUPER_ADMIN only)
   */
  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.userRepository.softDelete(id);
  }
}
