import { User } from '../../src/models/user.model';
import { UserRole } from '../../src/types/enums/user-role.enum';
import { PaginatedResult } from '../../src/types/response.types';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_TOTAL_PAGES,
  FINANCE_ADMIN_EMAIL,
  FINANCE_ADMIN_FULL_NAME,
  TEST_CREATED_AT,
  TEST_PASSWORD_HASH,
  TEST_UPDATED_AT,
  TEST_USER_ID,
} from './constants';

/**
 * Test Helper Functions (Unit Test)
 *
 * Factory function dan builder yang digunakan ulang di seluruh spec file.
 * Tujuan: menghindari duplikasi kode setup di setiap test.
 *
 * Aturan penggunaan:
 *   - Selalu gunakan builder ini untuk membuat objek fixture
 *   - Gunakan parameter `overrides` untuk menyesuaikan field tertentu per test case
 *   - Jangan membuat objek User / Tenant / dll secara manual di dalam spec file
 *
 * Cara pakai:
 *   const user = buildUser({ role: UserRole.SUPER_ADMIN });
 *   const repo  = mockUserRepository();
 */

// ---------------------------------------------------------------------------
// User Builder
// ---------------------------------------------------------------------------

/**
 * Membuat objek User fixture dengan nilai default yang valid.
 * Gunakan `overrides` untuk mengubah field tertentu.
 *
 * Catatan: passwordHash tidak di-set secara default (select: false pada entity).
 * Gunakan overrides jika test memerlukan passwordHash.
 */
export function buildUser(overrides: Partial<User> = {}): User {
  const user = new User();
  user.id = TEST_USER_ID;
  user.fullName = FINANCE_ADMIN_FULL_NAME;
  user.email = FINANCE_ADMIN_EMAIL;
  user.role = UserRole.FINANCE_ADMIN;
  user.isActive = true;
  user.lastLoginAt = null;
  user.createdAt = TEST_CREATED_AT;
  user.updatedAt = TEST_UPDATED_AT;
  user.deletedAt = null;
  return Object.assign(user, overrides);
}

/**
 * Membuat objek User fixture dengan passwordHash terisi.
 * Digunakan khusus untuk test yang mensimulasikan findByEmailWithPassword.
 */
export function buildUserWithPassword(overrides: Partial<User> = {}): User {
  return buildUser({ passwordHash: TEST_PASSWORD_HASH, ...overrides });
}

// ---------------------------------------------------------------------------
// Paginated Result Builder
// ---------------------------------------------------------------------------

/**
 * Membuat objek PaginatedResult fixture dengan nilai default.
 * Cocok untuk mock return value dari repository.findAll().
 *
 * Contoh:
 *   repository.findAll.mockResolvedValue(buildPaginatedResult([user]));
 */
export function buildPaginatedResult<T>(
  items: T[] = [],
  overrides: Partial<PaginatedResult<T>> = {},
): PaginatedResult<T> {
  return {
    items,
    total: items.length,
    page: DEFAULT_PAGE,
    limit: DEFAULT_LIMIT,
    totalPages: DEFAULT_TOTAL_PAGES,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Repository Mock Factories
// ---------------------------------------------------------------------------

/**
 * Membuat mock lengkap untuk UserRepository.
 * Semua method adalah jest.fn() sehingga setiap test bisa konfigurasi sendiri.
 *
 * Contoh:
 *   const repo = mockUserRepository();
 *   repo.findById.mockResolvedValue(buildUser());
 */
export function mockUserRepository() {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
}

/**
 * Membuat mock lengkap untuk AuditLogService.
 * Digunakan di test Tenant, Invoice, dan module lain yang wajib menulis audit log.
 *
 * Contoh:
 *   const auditService = mockAuditLogService();
 *   auditService.log.mockResolvedValue(undefined);
 */
export function mockAuditLogService() {
  return {
    log: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
  };
}

/**
 * Membuat mock lengkap untuk RealtimeService (SSE).
 * Digunakan di test Tenant dan Invoice yang mempublish SSE event.
 *
 * Contoh:
 *   const realtimeService = mockRealtimeService();
 *   realtimeService.publish.mockReturnValue(undefined);
 */
export function mockRealtimeService() {
  return {
    publish: jest.fn(),
    getStream: jest.fn(),
  };
}
