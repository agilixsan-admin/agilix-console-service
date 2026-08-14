import * as Joi from 'joi';

/**
 * Env Validation Schema
 *
 * Seluruh env variable wajib yang diperlukan saat startup divalidasi di sini.
 * Jika ada variable yang tidak ada atau tidak valid, aplikasi akan gagal start
 * dengan pesan error yang jelas — mencegah silent misconfiguration.
 *
 * Referensi: IMPLEMENTATION_ROADMAP.md Phase 10 § Security
 */
export const validationSchema = Joi.object({
  // Server
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
  HOST: Joi.string().default('localhost'),

  // Database — wajib tersedia
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().integer().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_NAME: Joi.string().required(),
  DB_SSL: Joi.boolean().default(false),

  // JWT — wajib tersedia, minimum 32 karakter untuk keamanan
  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.base': 'JWT_SECRET must be a string',
    'string.min': 'JWT_SECRET must be at least 32 characters long',
    'any.required': 'JWT_SECRET is required and must not be empty',
  }),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().messages({
    'string.base': 'JWT_REFRESH_SECRET must be a string',
    'string.min': 'JWT_REFRESH_SECRET must be at least 32 characters long',
    'any.required': 'JWT_REFRESH_SECRET is required and must not be empty',
  }),
  JWT_EXPIRES_IN: Joi.string().default('30m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().integer().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),

  // SMTP
  SMTP_HOST: Joi.string().default('smtp.mailtrap.io'),
  SMTP_PORT: Joi.number().integer().default(2525),
  SMTP_USERNAME: Joi.string().allow('').default(''),
  SMTP_PASSWORD: Joi.string().allow('').default(''),
  SMTP_FROM: Joi.string().email().default('noreply@agilix.id'),

  // Bcrypt
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(10).max(14).default(12),

  // CORS
  CORS_ORIGIN: Joi.string().allow('').optional(),

  // Cron Schedule — format cron expression "MENIT JAM * * *"
  CRON_INVOICE_REMINDER: Joi.string().default('0 8 * * *'),
  CRON_INVOICE_OVERDUE: Joi.string().default('0 9 * * *'),

  // ERP Webhook — Console → ERP
  ERP_WEBHOOK_URL: Joi.string().uri().allow('').default(''),
  ERP_WEBHOOK_API_KEY: Joi.string().allow('').default(''),
  ERP_WEBHOOK_TIMEOUT: Joi.number().integer().default(5000),
});
