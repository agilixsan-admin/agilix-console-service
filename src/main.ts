import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import helmet from 'helmet';
import Redis from 'ioredis';
import * as nodemailer from 'nodemailer';
import { AppModule } from './app.module';
import { GLOBAL_PREFIX } from './configs/route';

const logger = new Logger('Bootstrap');

/**
 * Cek koneksi PostgreSQL via TypeORM DataSource yang sudah diinisialisasi
 * oleh NestJS. Kalau DataSource belum initialized, berarti koneksi gagal
 * saat module load dan NestJS sudah throw error sebelum ini dipanggil.
 * Method ini log status untuk konfirmasi.
 */
async function checkDatabase(app: INestApplication): Promise<void> {
  try {
    const dataSource = app.get<DataSource>(getDataSourceToken());
    if (dataSource.isInitialized) {
      type PgVersionRow = { version: string };
      const raw: unknown = await dataSource.query('SELECT version()');
      const rows = raw as PgVersionRow[];
      const version =
        rows[0]?.version?.split(' ').slice(0, 2).join(' ') ?? 'unknown';
      logger.log(`✅ PostgreSQL connected — ${version}`);
    } else {
      logger.warn('⚠️  PostgreSQL DataSource not initialized');
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ PostgreSQL connection check failed: ${msg}`);
  }
}

/**
 * Cek koneksi Redis dengan membuat koneksi sementara (ping/quit).
 * Tidak menggunakan koneksi BullMQ yang ada supaya tidak interferensi.
 */
async function checkRedis(config: ConfigService): Promise<void> {
  const host = config.get<string>('redis.host') ?? 'localhost';
  const port = config.get<number>('redis.port') ?? 6379;
  const password = config.get<string>('redis.password') || undefined;

  const client = new Redis({
    host,
    port,
    password,
    lazyConnect: true,
    connectTimeout: 5000,
  });

  try {
    await client.connect();
    const pong = await client.ping();
    if (pong === 'PONG') {
      logger.log(`✅ Redis connected — ${host}:${port}`);
    } else {
      logger.warn(
        `⚠️  Redis ping returned unexpected response: ${String(pong)}`,
      );
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Redis connection failed (${host}:${port}): ${msg}`);
  } finally {
    await client.quit().catch(() => {
      /* suppress quit errors */
    });
  }
}

/**
 * Cek koneksi SMTP dengan nodemailer verify().
 * Tidak mengirim email — hanya verifikasi socket dan auth.
 */
async function checkSmtp(config: ConfigService): Promise<void> {
  const host = config.get<string>('smtp.host') ?? '';
  const port = config.get<number>('smtp.port') ?? 587;
  const user = config.get<string>('smtp.username') ?? '';

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: config.get<string>('smtp.password') ?? '' },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
  });

  try {
    await transporter.verify();
    logger.log(`✅ SMTP connected — ${host}:${port} (user: ${user || 'none'})`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`⚠️  SMTP connection failed (${host}:${port}): ${msg}`);
    // SMTP gagal = warning, bukan fatal. App tetap bisa jalan.
  } finally {
    transporter.close();
  }
}

/**
 * Tampilkan ringkasan konfigurasi environment saat startup.
 * Tidak menampilkan nilai sensitif (password, secret).
 */
function logEnvironmentInfo(config: ConfigService, port: number): void {
  const nodeEnv =
    config.get<string>('server.nodeEnv') ??
    process.env.NODE_ENV ??
    'development';
  const dbHost = config.get<string>('database.host') ?? 'localhost';
  const dbPort = config.get<number>('database.port') ?? 5432;
  const dbName = config.get<string>('database.name') ?? '-';
  const dbUser = config.get<string>('database.username') ?? '-';
  const dbSsl = config.get<boolean>('database.ssl') ? 'enabled' : 'disabled';
  const redisHost = config.get<string>('redis.host') ?? 'localhost';
  const redisPort = config.get<number>('redis.port') ?? 6379;
  const smtpHost = config.get<string>('smtp.host') ?? '-';
  const smtpPort = config.get<number>('smtp.port') ?? 587;
  const smtpFrom = config.get<string>('smtp.from') ?? '-';
  const jwtExp = config.get<string>('jwt.expiresIn') ?? '-';

  logger.log('─────────────────────────────────────────');
  logger.log(' Agilix Console Service — Startup Config ');
  logger.log('─────────────────────────────────────────');
  logger.log(`  ENV          : ${nodeEnv}`);
  logger.log(`  PORT         : ${port}`);
  logger.log(`  API PREFIX   : /${GLOBAL_PREFIX}`);
  logger.log(
    `  DB           : postgresql://${dbUser}@${dbHost}:${dbPort}/${dbName} (SSL: ${dbSsl})`,
  );
  logger.log(`  REDIS        : ${redisHost}:${redisPort}`);
  logger.log(`  SMTP         : ${smtpHost}:${smtpPort} (from: ${smtpFrom})`);
  logger.log(`  JWT EXP      : ${jwtExp}`);
  logger.log('─────────────────────────────────────────');
}

/**
 * Bootstrap
 *
 * Entry point aplikasi.
 * Konfigurasi global diterapkan di sini sebelum server mulai listen.
 *
 * Global setup:
 *   - setGlobalPrefix    — semua endpoint berada di bawah /api/v1
 *   - ValidationPipe     — aktifkan validasi DTO secara global
 *   - enableCors         — izinkan cross-origin request (dikonfigurasi dari env)
 *   - helmet             — HTTP security headers
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Matikan NestJS default logger sementara — kita pakai logger manual
    // di bawah agar urutan log lebih terkontrol.
    bufferLogs: true,
  });

  // Aktifkan NestJS built-in logger — flush semua buffered log dari module init
  app.useLogger(new Logger());

  // ---------------------------------------------------------------------------
  // Helmet — HTTP Security Headers
  // Dipasang sebelum route agar berlaku untuk semua request.
  // IMPLEMENTATION_ROADMAP.md Phase 10 § Security
  // ---------------------------------------------------------------------------
  app.use(helmet());

  // ---------------------------------------------------------------------------
  // Global API Prefix
  // API_SPEC.md § API Versioning: base URL /api/v1
  // ---------------------------------------------------------------------------
  app.setGlobalPrefix(GLOBAL_PREFIX);

  // ---------------------------------------------------------------------------
  // Global Validation Pipe
  // AGENTS.md § DTO Rules: validasi wajib di semua endpoint
  // ---------------------------------------------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ---------------------------------------------------------------------------
  // CORS
  // ---------------------------------------------------------------------------
  const isDevEnv = (process.env.NODE_ENV ?? 'development') === 'development';
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : isDevEnv
      ? '*'
      : false;

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: corsOrigin !== '*' && corsOrigin !== false,
  });

  // ---------------------------------------------------------------------------
  // Swagger API Documentation
  // Available at: /api-docs
  // ---------------------------------------------------------------------------
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Agilix Console Service API')
    .setDescription('SaaS Monitoring Tenant POS - API Documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication & authorization')
    .addTag('Dashboard', 'Analytics dashboard')
    .addTag('Tenants', 'Tenant management')
    .addTag('Users', 'User management')
    .addTag('Invoices', 'Invoice management')
    .addTag('POS Devices', 'POS device monitoring')
    .addTag('Notifications', 'Notification system')
    .addTag('Audit Logs', 'System audit logs')
    .addTag('Events', 'Server-Sent Events (SSE)')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      tagsSorter: 'none',
      operationsSorter: 'alpha',
    },
  });

  // ---------------------------------------------------------------------------
  // Start server
  // ---------------------------------------------------------------------------
  const config = app.get(ConfigService);
  const port =
    config.get<number>('server.port') ??
    parseInt(process.env.PORT ?? '3000', 10);

  // Log environment info sebelum listen
  logEnvironmentInfo(config, port);

  await app.listen(port);

  // ---------------------------------------------------------------------------
  // Post-startup diagnostic checks
  // Dijalankan SETELAH app.listen() agar semua module (TypeORM, BullMQ) sudah
  // selesai diinisialisasi. Hasil check ditampilkan ke log untuk observability.
  // ---------------------------------------------------------------------------
  logger.log('🔍 Running startup diagnostics...');
  await Promise.all([
    checkDatabase(app),
    checkRedis(config),
    checkSmtp(config),
  ]);

  logger.log('─────────────────────────────────────────');
  logger.log(`🚀 App running → http://localhost:${port}/${GLOBAL_PREFIX}`);
  logger.log(`📚 Swagger    → http://localhost:${port}/api-docs`);
  logger.log('─────────────────────────────────────────');
}

void bootstrap();
