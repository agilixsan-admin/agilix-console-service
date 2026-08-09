import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../models/user.model';

// Load .env sebelum membaca process.env
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'agilix_console',
  entities: [
    User,
    // Tenant,      — Phase 2.2
    // Invoice,     — Phase 3.1
    // PosDevice,   — Phase 3 (POS Device)
    // AuditLog,    — Phase 2.1
    // Notification — Phase 3.3
  ],

  migrations: [
    'src/migrations/*.ts',
  ],

  synchronize: false, // ← WAJIB false — DATABASE_RULES.md § Migration Policy

  logging: process.env.NODE_ENV === 'development',

  ssl:
    process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
});
