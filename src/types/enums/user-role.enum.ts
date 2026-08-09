/**
 * UserRole Enum
 *
 * Defines all valid roles for system administrators.
 * Source of truth: DOMAIN_MODEL.md → Enums → UserRole
 * RBAC matrix: RBAC_MATRIX.md
 *
 * FORBIDDEN: Never use this enum directly inside service business logic
 * as a conditional (if user.role === UserRole.SUPER_ADMIN).
 * Authorization must flow through Guards and Decorators only.
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  FINANCE_ADMIN = 'FINANCE_ADMIN',
  SUPPORT_ADMIN = 'SUPPORT_ADMIN',
  VIEWER = 'VIEWER',
}
