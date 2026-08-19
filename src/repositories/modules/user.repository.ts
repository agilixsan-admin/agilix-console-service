import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../../models/user.model';
import { UserRole } from '../../types/enums/user-role.enum';
import { PaginatedResult } from '../../types/response.types';

/**
 * FindAllOptions — query parameters for the user list query.
 */
export interface FindAllUsersOptions {
  /** 1-based page number. Default: 1 */
  page: number;
  /** Records per page. Default: 10. Maximum: 100 (DATABASE_RULES.md § Pagination) */
  limit: number;
  /** Optional full-text search against fullName and email */
  search?: string;
  /** Optional role filter */
  role?: UserRole;
  /** Optional isActive filter */
  isActive?: boolean;
}

/**
 * UserRepository
 *
 * The sole layer authorised to access the `users` table.
 * Source of truth:
 *   - ARCHITECTURE_RULES.md  → Repository Responsibilities
 *   - DATABASE_RULES.md      → Repository Only, Pagination, Sorting
 *   - DOMAIN_MODEL.md        → Entity: User
 *
 * Rules enforced here:
 *   ✓ Default sort: created_at DESC  (DATABASE_RULES.md § Sorting)
 *   ✓ Max limit capped at 100       (DATABASE_RULES.md § Pagination)
 *   ✓ passwordHash is included only where explicitly required (findByEmailWithPassword)
 *   ✓ Soft-deleted records are excluded automatically by TypeORM
 *
 * FORBIDDEN in this class:
 *   ✗ Business logic
 *   ✗ Authorization logic
 *   ✗ Workflow decisions
 */
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  // ---------------------------------------------------------------------------
  // Read operations
  // ---------------------------------------------------------------------------

  /**
   * Find a user by primary key.
   * Excludes soft-deleted records automatically.
   * passwordHash is NOT selected (select: false on entity).
   */
  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  /**
   * Find a user by email address.
   * passwordHash is NOT selected.
   * Used for duplicate-email validation during creation.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  /**
   * Find a user by email, explicitly selecting the passwordHash column.
   * ONLY to be called from AuthService during login validation.
   * Must never be exposed to controllers or used in list queries.
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .andWhere('user.deletedAt IS NULL')
      .getOne();
  }

  /**
   * Paginated list of users with optional filters.
   *
   * Filtering behaviour:
   *   - search: case-insensitive ILIKE match on fullName OR email
   *   - role: exact match
   *   - isActive: exact match
   *
   * Sorting: created_at DESC (DATABASE_RULES.md § Sorting — Default)
   * Pagination: page/limit with max cap at 100 (DATABASE_RULES.md § Pagination)
   */
  async findAll(options: FindAllUsersOptions): Promise<PaginatedResult<User>> {
    const page = options.page > 0 ? options.page : 1;
    const limit = Math.min(options.limit > 0 ? options.limit : 10, 100);
    const offset = (page - 1) * limit;

    const qb: SelectQueryBuilder<User> = this.repo
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (options.search) {
      qb.andWhere('(user.fullName ILIKE :search OR user.email ILIKE :search)', {
        search: `%${options.search}%`,
      });
    }

    if (options.role !== undefined) {
      qb.andWhere('user.role = :role', { role: options.role });
    }

    if (options.isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive: options.isActive });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ---------------------------------------------------------------------------
  // Write operations
  // ---------------------------------------------------------------------------

  /**
   * Persist a new User record.
   * Caller (UserService) is responsible for hashing the password before calling this.
   */
  async create(data: Partial<User>): Promise<User> {
    const user = this.repo.create(data);
    const saved = await this.repo.save(user);
    // Re-query dari DB supaya passwordHash (select: false) tidak ikut di response
    return this.repo.findOneOrFail({ where: { id: saved.id } });
  }

  /**
   * Update mutable fields on an existing user.
   * Returns the updated entity.
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  /**
   * Soft delete a user record.
   * Sets deleted_at to the current timestamp.
   * TypeORM's softDelete respects the @DeleteDateColumn decorator.
   */
  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
