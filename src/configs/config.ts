import { registerAs } from '@nestjs/config';
export const serverConfig = registerAs('server', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  host: process.env.HOST ?? 'localhost',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  apiPrefix: 'api/v1',
}));

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  name: process.env.DB_NAME ?? 'agilix_console',
  ssl: process.env.DB_SSL === 'true',
  logging: process.env.DB_LOGGING === 'true',
  synchronize: false, // ← WAJIB false — DATABASE_RULES.md § Migration Policy
}));
export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN ?? '30m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
}));
export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD ?? '',
}));
export const smtpConfig = registerAs('smtp', () => ({
  host: process.env.SMTP_HOST ?? 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT ?? '2525', 10),
  username: process.env.SMTP_USERNAME ?? '',
  password: process.env.SMTP_PASSWORD ?? '',
  from: process.env.SMTP_FROM ?? 'noreply@agilix.id',
}));
export const bcryptConfig = registerAs('bcrypt', () => ({
  saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10),
}));

export const cronConfig = registerAs('cron', () => ({
  // Format: "MENIT JAM * * *" — default reminder jam 08:00, overdue jam 09:00
  reminderSchedule: process.env.CRON_INVOICE_REMINDER ?? '0 8 * * *',
  overdueSchedule: process.env.CRON_INVOICE_OVERDUE ?? '0 9 * * *',
}));

export const erpConfig = registerAs('erp', () => ({
  webhookUrl: process.env.ERP_WEBHOOK_URL ?? '',
  webhookApiKey: process.env.ERP_WEBHOOK_API_KEY ?? '',
  // Timeout dalam ms untuk HTTP call ke ERP
  webhookTimeout: parseInt(process.env.ERP_WEBHOOK_TIMEOUT ?? '5000', 10),
}));
