import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { Server } from 'net';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/models/user.model';
import { UserRole } from '../../src/types/enums/user-role.enum';
import { GLOBAL_PREFIX } from '../../src/configs/route';
import { seedEmailTemplates } from '../../src/seeds/email-template.seed';

// ---------------------------------------------------------------------------
// Environment override untuk integration test
// NODE_ENV=test di-set via Jest setupFiles (test/config/jest-setup-env.ts)
// agar terbaca sebelum app.module.ts di-import
// ---------------------------------------------------------------------------
process.env.DB_HOST = process.env.TEST_DB_HOST ?? 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT ?? '5435';
process.env.DB_USERNAME = process.env.TEST_DB_USERNAME ?? 'agilix_test';
process.env.DB_PASSWORD =
  process.env.TEST_DB_PASSWORD ?? 'agilix_test_password';
process.env.DB_NAME = process.env.TEST_DB_NAME ?? 'agilix_console_test';
process.env.REDIS_HOST = process.env.TEST_REDIS_HOST ?? 'localhost';
process.env.REDIS_PORT = process.env.TEST_REDIS_PORT ?? '6380';
process.env.JWT_SECRET = 'integration-test-jwt-secret-min-32-chars-ok';
process.env.JWT_REFRESH_SECRET = 'integration-test-refresh-secret-min-32-chars';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '1025';
process.env.SMTP_USERNAME = '';
process.env.SMTP_PASSWORD = '';
process.env.SMTP_FROM = 'test@agilix.id';
process.env.SEED_SUPER_ADMIN_EMAIL = 'superadmin@test.agilix.id';
process.env.SEED_SUPER_ADMIN_PASSWORD = 'SuperAdmin@Test123';

// ---------------------------------------------------------------------------
// Credentials untuk test user yang akan di-seed sebelum test
// ---------------------------------------------------------------------------
export const INTEGRATION_SUPER_ADMIN_EMAIL = 'superadmin@test.agilix.id';
export const INTEGRATION_SUPER_ADMIN_PASSWORD = 'SuperAdmin@Test123';

let app: INestApplication;
let dataSource: DataSource;

/**
 * Bootstrap NestJS app untuk integration test.
 * Panggil di beforeAll() pada setiap spec file.
 */
export async function bootstrapApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();

  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();

  dataSource = app.get<DataSource>(getDataSourceToken());

  return app;
}

/**
 * Jalankan semua migration di database test.
 * Dipanggil sekali di awal sebelum semua test suite.
 */
export async function runMigrations(): Promise<void> {
  await dataSource.runMigrations();
}

/**
 * Drop semua tabel dan jalankan ulang migration.
 * Gunakan di beforeEach() untuk state yang bersih per test.
 */
export async function resetDatabase(): Promise<void> {
  await dataSource.dropDatabase();
  await dataSource.runMigrations();
  await seedEmailTemplates(dataSource);
}

/**
 * Seed super admin user untuk keperluan login di integration test.
 */
export async function seedTestSuperAdmin(): Promise<User> {
  const userRepository = dataSource.getRepository(User);

  const existing = await userRepository.findOne({
    where: { email: INTEGRATION_SUPER_ADMIN_EMAIL },
  });

  if (existing) return existing;

  const passwordHash = await bcrypt.hash(INTEGRATION_SUPER_ADMIN_PASSWORD, 10);

  const superAdmin = userRepository.create({
    fullName: 'Integration Test Super Admin',
    email: INTEGRATION_SUPER_ADMIN_EMAIL,
    passwordHash,
    role: UserRole.SUPER_ADMIN,
    isActive: true,
  });

  return userRepository.save(superAdmin);
}

/**
 * Login dan kembalikan access token.
 * Dipakai di test yang butuh auth.
 */
interface LoginResponseBody {
  data: {
    accessToken: string;
  };
}

export async function loginAs(
  appInstance: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const res = await request(appInstance.getHttpServer() as Server)
    .post(`/${GLOBAL_PREFIX}/auth/login`)
    .send({ email, password })
    .expect(200);

  return (res.body as LoginResponseBody).data.accessToken;
}

/**
 * Tutup app setelah semua test selesai.
 * Panggil di afterAll().
 */
export async function closeApp(): Promise<void> {
  if (app) {
    await app.close();
  }
}

export { app, dataSource };
