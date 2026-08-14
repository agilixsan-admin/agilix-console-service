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
    'jwt.secret': 'test-jwt-secret-fixture-minimum-32-characters-long',
    'jwt.refreshSecret':
      'test-jwt-refresh-secret-fixture-minimum-32-characters',
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
import { TEST_AUDIT_LOG_ID } from './constants';

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
  tenant.planType = PlanType.MONTHLY;
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
    publishTenantCreated: jest.fn(),
    publishTenantUpdated: jest.fn(),
    publishTenantLocked: jest.fn(),
    publishTenantUnlocked: jest.fn(),
    publishInvoiceGenerated: jest.fn(),
    publishInvoiceOverdue: jest.fn(),
    publishPaymentReceived: jest.fn(),
    publishInvoiceCancelled: jest.fn(),
    publishDeviceRegistered: jest.fn(),
    publishDeviceOnline: jest.fn(),
    publishDeviceOffline: jest.fn(),
    publishNotificationSent: jest.fn(),
    publishNotificationFailed: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Invoice Builder
// ---------------------------------------------------------------------------

import { Invoice } from '../../src/models/invoice.model';
import { InvoiceStatus } from '../../src/types/enums/invoice-status.enum';
import {
  TEST_INVOICE_ID,
  TEST_INVOICE_NUMBER,
  TEST_INVOICE_AMOUNT,
  TEST_BILLING_PERIOD,
  TEST_DUE_DATE,
} from './constants';

export function buildInvoice(overrides: Partial<Invoice> = {}): Invoice {
  const invoice = new Invoice();
  invoice.id = TEST_INVOICE_ID;
  invoice.tenantId = TEST_TENANT_ID;
  invoice.invoiceNumber = TEST_INVOICE_NUMBER;
  invoice.amount = TEST_INVOICE_AMOUNT;
  invoice.billingPeriod = TEST_BILLING_PERIOD;
  invoice.dueDate = TEST_DUE_DATE;
  invoice.paidAt = null;
  invoice.status = InvoiceStatus.PENDING;
  invoice.notes = null;
  invoice.createdAt = TEST_CREATED_AT;
  invoice.updatedAt = TEST_UPDATED_AT;
  return Object.assign(invoice, overrides);
}

export function mockInvoiceRepository() {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findByInvoiceNumber: jest.fn(),
    countByTenantAndStatus: jest.fn(),
    countByBillingPeriod: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// PosDevice Builder
// ---------------------------------------------------------------------------

import { PosDevice } from '../../src/models/pos-device.model';
import { DeviceStatus } from '../../src/types/enums/device-status.enum';
import {
  TEST_DEVICE_ID,
  TEST_DEVICE_CODE,
  TEST_DEVICE_NAME,
} from './constants';

export function buildPosDevice(overrides: Partial<PosDevice> = {}): PosDevice {
  const device = new PosDevice();
  device.id = TEST_DEVICE_ID;
  device.tenantId = TEST_TENANT_ID;
  device.deviceCode = TEST_DEVICE_CODE;
  device.deviceName = TEST_DEVICE_NAME;
  device.status = DeviceStatus.OFFLINE;
  device.isLocked = false;
  device.lastSeenAt = null;
  device.createdAt = TEST_CREATED_AT;
  device.updatedAt = TEST_UPDATED_AT;
  return Object.assign(device, overrides);
}

export function mockPosDeviceRepository() {
  return {
    findById: jest.fn(),
    findByDeviceCode: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    countByStatus: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Notification Builder
// ---------------------------------------------------------------------------

import { Notification } from '../../src/models/notification.model';
import { NotificationStatus } from '../../src/types/enums/notification-status.enum';
import { NotificationType } from '../../src/types/enums/notification-type.enum';
import { TEST_NOTIFICATION_ID } from './constants';

export function buildNotification(
  overrides: Partial<Notification> = {},
): Notification {
  const notification = new Notification();
  notification.id = TEST_NOTIFICATION_ID;
  notification.tenantId = TEST_TENANT_ID;
  notification.type = NotificationType.INVOICE_EMAIL;
  notification.recipient = TEST_OWNER_EMAIL;
  notification.subject = 'Invoice Tagihan Bulan Ini';
  notification.content = 'Silakan bayar tagihan Anda sebelum jatuh tempo.';
  notification.status = NotificationStatus.PENDING;
  notification.sentAt = null;
  notification.failureReason = null;
  notification.createdAt = TEST_CREATED_AT;
  return Object.assign(notification, overrides);
}

export function mockNotificationRepository() {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
}

export function mockDashboardTenantRepository() {
  return {
    countByStatus: jest.fn(),
    getMonthlyGrowth: jest.fn(),
  };
}

export function mockDashboardInvoiceRepository() {
  return {
    countOverdue: jest.fn(),
    getRevenueByPeriod: jest.fn(),
  };
}

export function mockDashboardPosDeviceRepository() {
  return {
    countByStatus: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Mock: WebhookDispatcherService
// ---------------------------------------------------------------------------

export function mockWebhookDispatcherService() {
  return {
    dispatch: jest.fn().mockResolvedValue(undefined),
  };
}

// ---------------------------------------------------------------------------
// Mock: NotificationService
// ---------------------------------------------------------------------------

export function mockNotificationService() {
  return {
    create: jest.fn().mockResolvedValue({ id: 'mock-notification-id' }),
    findAll: jest.fn(),
    findById: jest.fn(),
    markSent: jest.fn(),
    markFailed: jest.fn(),
    resend: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Mock: EmailTemplateRepository
// ---------------------------------------------------------------------------

export function mockEmailTemplateRepository() {
  return {
    findBySlug: jest.fn(),
    render: jest.fn().mockResolvedValue({
      subject: 'Test Subject',
      html: '<p>Test HTML</p>',
    }),
  };
}

// ---------------------------------------------------------------------------
// Mock: BullMQ Queue (email-notification)
// ---------------------------------------------------------------------------

export function mockEmailQueue() {
  return {
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
  };
}
