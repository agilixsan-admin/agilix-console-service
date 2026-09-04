export const GLOBAL_PREFIX = 'api/v1';
export const API_VERSION = 'v1';
export const ROUTES = {
  AUTH: 'auth',
  USERS: 'users',
  TENANTS: 'tenants',
  INVOICES: 'invoices',
  POS_DEVICES: 'pos-devices',
  AUDIT_LOGS: 'audit-logs',
  NOTIFICATIONS: 'notifications',
  EVENTS: 'events',
  DASHBOARD: 'dashboard',
} as const;

export type RouteKey = keyof typeof ROUTES;
