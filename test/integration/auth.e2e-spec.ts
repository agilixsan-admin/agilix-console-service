import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  bootstrapApp,
  closeApp,
  resetDatabase,
  seedTestSuperAdmin,
  loginAs,
  INTEGRATION_SUPER_ADMIN_EMAIL,
  INTEGRATION_SUPER_ADMIN_PASSWORD,
} from '../config/integration-setup';
import { GLOBAL_PREFIX } from '../../src/configs/route';

describe('Auth (integration)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    app = await bootstrapApp();
    await resetDatabase();
    await seedTestSuperAdmin();
  }, 30_000);

  afterAll(async () => {
    await closeApp();
  });

  // ---------------------------------------------------------------------------
  // POST /auth/login
  // ---------------------------------------------------------------------------
  describe('POST /auth/login', () => {
    it('harus mengembalikan accessToken dan refreshToken saat credentials valid', async () => {
      const res = await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/login`)
        .send({
          email: INTEGRATION_SUPER_ADMIN_EMAIL,
          password: INTEGRATION_SUPER_ADMIN_PASSWORD,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe(INTEGRATION_SUPER_ADMIN_EMAIL);

      accessToken = res.body.data.accessToken as string;
      refreshToken = res.body.data.refreshToken as string;
    });

    it('harus mengembalikan 401 saat password salah', async () => {
      const res = await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/login`)
        .send({
          email: INTEGRATION_SUPER_ADMIN_EMAIL,
          password: 'WrongPassword@999',
        })
        .expect(401);

      expect(res.body.success).toBeUndefined();
    });

    it('harus mengembalikan 401 saat email tidak terdaftar', async () => {
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/login`)
        .send({
          email: 'notexist@test.com',
          password: INTEGRATION_SUPER_ADMIN_PASSWORD,
        })
        .expect(401);
    });

    it('harus mengembalikan 400 saat body tidak lengkap', async () => {
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/login`)
        .send({ email: INTEGRATION_SUPER_ADMIN_EMAIL })
        .expect(400);
    });

    it('harus mengembalikan 400 saat email format tidak valid', async () => {
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/login`)
        .send({
          email: 'bukan-email',
          password: INTEGRATION_SUPER_ADMIN_PASSWORD,
        })
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /auth/profile
  // ---------------------------------------------------------------------------
  describe('GET /auth/profile', () => {
    it('harus mengembalikan profile user yang sedang login', async () => {
      const token = await loginAs(
        app,
        INTEGRATION_SUPER_ADMIN_EMAIL,
        INTEGRATION_SUPER_ADMIN_PASSWORD,
      );

      const res = await request(app.getHttpServer())
        .get(`/${GLOBAL_PREFIX}/auth/profile`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(INTEGRATION_SUPER_ADMIN_EMAIL);
    });

    it('harus mengembalikan 401 tanpa token', async () => {
      await request(app.getHttpServer())
        .get(`/${GLOBAL_PREFIX}/auth/profile`)
        .expect(401);
    });

    it('harus mengembalikan 401 dengan token tidak valid', async () => {
      await request(app.getHttpServer())
        .get(`/${GLOBAL_PREFIX}/auth/profile`)
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /auth/refresh
  // ---------------------------------------------------------------------------
  describe('POST /auth/refresh', () => {
    it('harus mengembalikan accessToken baru dengan refreshToken valid', async () => {
      // Login ulang untuk dapat refresh token yang fresh
      const loginRes = await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/login`)
        .send({
          email: INTEGRATION_SUPER_ADMIN_EMAIL,
          password: INTEGRATION_SUPER_ADMIN_PASSWORD,
        })
        .expect(200);

      const freshRefreshToken = loginRes.body.data.refreshToken as string;

      const res = await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/refresh`)
        .send({ refreshToken: freshRefreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('harus mengembalikan 401 dengan refreshToken tidak valid', async () => {
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/refresh`)
        .send({ refreshToken: 'invalid.refresh.token' })
        .expect(401);
    });

    it('harus mengembalikan 400 saat body kosong', async () => {
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/refresh`)
        .send({})
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /auth/logout
  // ---------------------------------------------------------------------------
  describe('POST /auth/logout', () => {
    it('harus berhasil logout dan blacklist refreshToken', async () => {
      // Login untuk dapat token fresh
      const loginRes = await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/login`)
        .send({
          email: INTEGRATION_SUPER_ADMIN_EMAIL,
          password: INTEGRATION_SUPER_ADMIN_PASSWORD,
        })
        .expect(200);

      const freshAccessToken = loginRes.body.data.accessToken as string;
      const freshRefreshToken = loginRes.body.data.refreshToken as string;

      // Logout
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/logout`)
        .set('Authorization', `Bearer ${freshAccessToken}`)
        .send({ refreshToken: freshRefreshToken })
        .expect(200);

      // Refresh token setelah logout harus ditolak (blacklisted)
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/refresh`)
        .send({ refreshToken: freshRefreshToken })
        .expect(401);
    });

    it('harus mengembalikan 401 tanpa access token', async () => {
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/logout`)
        .send({ refreshToken })
        .expect(401);
    });
  });
});
