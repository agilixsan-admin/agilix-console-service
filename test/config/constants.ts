import { UserRole } from '../../src/types/enums/user-role.enum';

/**
 * Test Constants
 *
 * Konstanta yang digunakan ulang di seluruh unit test dan integration test.
 * Tujuan: menghindari data hardcode berulang di setiap spec file.
 *
 * Aturan penggunaan:
 *   - Selalu import dari file ini, jangan tulis UUID / email / password langsung di spec
 *   - Jika butuh konstanta baru, tambahkan di sini
 */

// ---------------------------------------------------------------------------
// UUID Fixtures
// Gunakan format UUID v4 yang valid agar ParseUUIDPipe tidak reject di test
// ---------------------------------------------------------------------------

export const TEST_USER_ID = 'aaaaaaaa-1111-4000-8000-aaaaaaaaaaaa';
export const TEST_USER_ID_2 = 'bbbbbbbb-2222-4000-8000-bbbbbbbbbbbb';
export const TEST_USER_ID_NONEXISTENT = 'ffffffff-9999-4000-8000-ffffffffffff';

export const TEST_TENANT_ID = 'cccccccc-3333-4000-8000-cccccccccccc';
export const TEST_TENANT_ID_2 = 'dddddddd-4444-4000-8000-dddddddddddd';

export const TEST_INVOICE_ID = 'eeeeeeee-5555-4000-8000-eeeeeeeeeeee';
export const TEST_DEVICE_ID = 'f1f1f1f1-6666-4000-8000-f1f1f1f1f1f1';
export const TEST_AUDIT_LOG_ID = 'a2a2a2a2-7777-4000-8000-a2a2a2a2a2a2';
export const TEST_NOTIFICATION_ID = 'b3b3b3b3-8888-4000-8000-b3b3b3b3b3b3';

// ---------------------------------------------------------------------------
// User Fixtures
// ---------------------------------------------------------------------------

export const SUPER_ADMIN_EMAIL = 'superadmin@example.com';
export const FINANCE_ADMIN_EMAIL = 'finance@example.com';
export const SUPPORT_ADMIN_EMAIL = 'support@example.com';

export const SUPER_ADMIN_FULL_NAME = 'Super Administrator';
export const FINANCE_ADMIN_FULL_NAME = 'Finance Administrator';
export const SUPPORT_ADMIN_FULL_NAME = 'Support Administrator';

/** Password plaintext untuk dipakai di test create/login */
export const TEST_PASSWORD_PLAIN = 'TestPassword@123';

/** bcrypt hash dari TEST_PASSWORD_PLAIN (rounds=12) — pre-computed untuk tes yang tidak perlu hash ulang */
export const TEST_PASSWORD_HASH =
  '$2b$12$examplehashvaluethatisnotrealandisusedfortestingonly123456';

export const DEFAULT_USER_ROLE = UserRole.FINANCE_ADMIN;

// ---------------------------------------------------------------------------
// Tenant Fixtures
// ---------------------------------------------------------------------------

export const TEST_BUSINESS_NAME = 'ABC Store';
export const TEST_OWNER_NAME = 'John Doe';
export const TEST_OWNER_EMAIL = 'owner@abcstore.com';
export const TEST_OWNER_PHONE = '08123456789';

/** Tanggal expiry di masa depan — valid untuk pembuatan tenant baru */
export const FUTURE_EXPIRY_DATE = new Date('2027-12-31');

/** Tanggal expiry di masa lalu — untuk test validasi expiry */
export const PAST_EXPIRY_DATE = new Date('2020-01-01');

// ---------------------------------------------------------------------------
// Invoice Fixtures
// ---------------------------------------------------------------------------

export const TEST_INVOICE_NUMBER = 'INV-20260809-0001';
export const TEST_INVOICE_AMOUNT = 500000;
export const TEST_BILLING_PERIOD = '2026-08';
export const TEST_DUE_DATE = new Date('2026-08-30');

// ---------------------------------------------------------------------------
// POS Device Fixtures
// ---------------------------------------------------------------------------

export const TEST_DEVICE_CODE = 'POS-001';
export const TEST_DEVICE_NAME = 'Kasir Utama';

// ---------------------------------------------------------------------------
// Date Fixtures
// ---------------------------------------------------------------------------

export const TEST_DATE_NOW = new Date('2026-08-09T03:00:00.000Z');
export const TEST_CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
export const TEST_UPDATED_AT = new Date('2026-01-01T00:00:00.000Z');
export const TEST_PAID_AT = new Date('2026-08-09T10:00:00.000Z');

// ---------------------------------------------------------------------------
// Pagination Fixtures
// ---------------------------------------------------------------------------

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const DEFAULT_TOTAL_PAGES = 1;

// ---------------------------------------------------------------------------
// Auth / JWT Fixtures
// ---------------------------------------------------------------------------

export const TEST_ACCESS_TOKEN = 'test.access.token.fixture';
export const TEST_REFRESH_TOKEN = 'test.refresh.token.fixture';
export const TEST_JWT_SECRET = 'test-jwt-secret-fixture';
export const TEST_EXPIRES_IN = 1800;
