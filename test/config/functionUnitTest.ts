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

/**
 * Membuat mock untuk JwtService.
 */
export function mockJwtService() {
  return {
    sign: jest.fn(),
    verify: jest.fn(),
  };
}

/**
 * Membuat mock untuk ConfigService.
 * Default mengembalikan nilai yang umum digunakan di test auth.
 */
export function mockConfigService(overrides: Record<string, unknown> = {}) {
  const defaults: Record<string, unknown> = {
    'bcrypt.saltRounds': 10,
    'jwt.secret': 'test-jwt-secret-fixture',
    'jwt.expiresIn': '30m',
    'jwt.refreshExpiresIn': '7d',
    ...overrides,
  };
  return {
    get: jest.fn((key: string) => defaults[key]),
  };
}

// ---------------------------------------------------------------------------
// AuditLog Builder
// ---------------------------------------------------------------------------

import { AuditLog } from '../../src/models/audit-log.model';
import { AuditAction } from '../../src/types/enums/audit-action.enum';
import { TEST_AUDIT_LOG_ID, TEST_USER_ID } from './constants';

export function buildAuditLog(overrides: Partial<AuditLog> = {}): AuditLog {
  const log = new AuditLog();
  log.id = TEST_AUDIT_LOG_ID;
  log.actorId = TEST_USER_ID;
  log.tenantId = null;
  log.action = AuditAction.USER_CREATED;
  log.targetType = 'User';
  log.targetId = TEST_USER_ID;
  log.ipAddress = null;
  log.userAgent = null;
  log.metadata = null;
  log.createdAt = TEST_CREATED_AT;
  return Object.assign(log, overrides);
}

export function mockAuditLogRepository() {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tenant Builder
// ---------------------------------------------------------------------------

import { Tenant } from '../../src/models/tenant.model';
import { TenantStatus } from '../../src/types/enums/tenant-status.enum';
import { PlanType } from '../../src/types/enums/plan-type.enum';
import {
  TEST_TENANT_ID,
  TEST_BUSINESS_NAME,
  TEST_OWNER_NAME,
  TEST_OWNER_EMAIL,
  FUTURE_EXPIRY_DATE,
} from './constants';

export function buildTenant(overrides: Partial<Tenant> = {}): Tenant {
  const tenant = new Tenant();
  tenant.id = TEST_TENANT_ID;
  tenant.businessName = TEST_BUSINESS_NAME;
  tenant.ownerName = TEST_OWNER_NAME;
  tenant.ownerEmail = TEST_OWNER_EMAIL;
  tenant.ownerPhone = null;
  tenant.planType = PlanType.PRO;
  tenant.outletCount = 3;
  tenant.status = TenantStatus.ACTIVE;
  tenant.expiryDate = FUTURE_EXPIRY_DATE;
  tenant.notes = null;
  tenant.createdBy = TEST_USER_ID;
  tenant.createdAt = TEST_CREATED_AT;
  tenant.updatedAt = TEST_UPDATED_AT;
  tenant.deletedAt = null;
  return Object.assign(tenant, overrides);
}

export function mockTenantRepository() {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
}

export function mockEventPublisherService() {
  return {
    publishTenantLocked: jest.fn(),
    publishTenantUnlocked: jest.fn(),
    publishInvoiceGenerated: jest.fn(),
    publishInvoiceOverdue: jest.fn(),
    publishPaymentReceived: jest.fn(),
  };
}
