import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GLOBAL_PREFIX } from './configs/route';

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
  const app = await NestFactory.create(AppModule);

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
  const config = new DocumentBuilder()
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

  const document = SwaggerModule.createDocument(app, config);
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
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(
    `🚀 Agilix Console Service running on: http://localhost:${port}/${GLOBAL_PREFIX}`,
  );
  console.log(
    `📚 API Documentation available at: http://localhost:${port}/api-docs`,
  );
}

void bootstrap();
