import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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
 *
 * Security hardening (Helmet, Rate Limiter) akan ditambahkan di Phase 10
 * setelah seluruh domain module selesai diimplementasi.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ---------------------------------------------------------------------------
  // Global API Prefix
  // API_SPEC.md § API Versioning: base URL /api/v1
  // ---------------------------------------------------------------------------
  app.setGlobalPrefix(GLOBAL_PREFIX);

  // ---------------------------------------------------------------------------
  // Global Validation Pipe
  // AGENTS.md § DTO Rules: validasi wajib di semua endpoint
  //
  // whitelist: true          — strip properti yang tidak ada di DTO
  // forbidNonWhitelisted: true — throw 400 jika ada properti tidak dikenal
  // transform: true          — otomatis transform query string ke tipe yang benar
  //                            (misal: string "1" → number 1 untuk @IsInt())
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
  // Origin dikonfigurasi dari CORS_ORIGIN env variable.
  // Default '*' hanya untuk development — production wajib set origin spesifik.
  // ---------------------------------------------------------------------------
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ---------------------------------------------------------------------------
  // Start server
  // ---------------------------------------------------------------------------
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(
    `🚀 Agilix Console Service running on: http://localhost:${port}/${GLOBAL_PREFIX}`,
  );
}

bootstrap();
