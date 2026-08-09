import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../models/user.model';
import { AuditLog } from '../models/audit-log.model';
import { Tenant } from '../models/tenant.model';
import { Invoice } from '../models/invoice.model';
import { PosDevice } from '../models/pos-device.model';
import { Notification } from '../models/notification.model';
import { CreateUsersTable1723143600000 } from '../migrations/1723143600000-CreateUsersTable';
import { CreateAuditLogsTable1723143700000 } from '../migrations/1723143700000-CreateAuditLogsTable';
import { CreateTenantsTable1723143800000 } from '../migrations/1723143800000-CreateTenantsTable';
import { CreateInvoicesTable1723143900000 } from '../migrations/1723143900000-CreateInvoicesTable';
import { CreatePosDevicesTable1723144000000 } from '../migrations/1723144000000-CreatePosDevicesTable';
import { CreateNotificationsTable1723144100000 } from '../migrations/1723144100000-CreateNotificationsTable';
import { AddViewerRole1723144200000 } from '../migrations/1723144200000-AddViewerRole';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'agilix_console',
  entities: [User, AuditLog, Tenant, Invoice, PosDevice, Notification],
  migrations: [
    CreateUsersTable1723143600000,
    CreateAuditLogsTable1723143700000,
    CreateTenantsTable1723143800000,
    CreateInvoicesTable1723143900000,
    CreatePosDevicesTable1723144000000,
    CreateNotificationsTable1723144100000,
    AddViewerRole1723144200000,
  ],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
