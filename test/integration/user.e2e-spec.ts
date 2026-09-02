import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'net';
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
import { UserRole } from '../../src/types/enums/user-role.enum';

// ---------------------------------------------------------------------------
// Response body interfaces
// ---------------------------------------------------------------------------

interface UserData {
  id: string;
  email: string;
  role: string;
  fullName: string;
  isActive: boolean;
  passwordHash?: string;
}

interface UserResponseBody {
  success: boolean;
  data: UserData;
}

interface UserListData {
  items: UserData[];
  total: number;
}

interface UserListBody {
  success: boolean;
  data: UserListData;
}

describe('User (integration)', () => {
  let app: INestApplication;
  let superAdminToken: string;
  let createdUserId: string;

  beforeAll(async () => {
    app = await bootstrapApp();
    await resetDatabase();
    await seedTestSuperAdmin();
    superAdminToken = await loginAs(
      app,
      INTEGRATION_SUPER_ADMIN_EMAIL,
      INTEGRATION_SUPER_ADMIN_PASSWORD,
    );
  }, 30_000);

  afterAll(async () => {
    await closeApp();
  });

  // ---------------------------------------------------------------------------
  // POST /users
  // ---------------------------------------------------------------------------
  describe('POST /users', () => {
    it('harus berhasil membuat user baru dengan data valid', async () => {
      const res = await request(app.getHttpServer() as Server)
        .post(`/${GLOBAL_PREFIX}/users`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          fullName: 'Finance User Test',
          email: 'finance-test@agilix.id',
          password: 'Finance@Test123',
          role: UserRole.FINANCE_ADMIN,
        })
        .expect(201);

      const body = res.body as UserResponseBody;
      expect(body.success).toBe(true);
      expect(body.data.email).toBe('finance-test@agilix.id');
      expect(body.data.role).toBe(UserRole.FINANCE_ADMIN);
      expect(body.data.passwordHash).toBeUndefined();

      createdUserId = body.data.id;
    });

    it('harus mengembalikan 409 saat email sudah dipakai', async () => {
      await request(app.getHttpServer() as Server)
        .post(`/${GLOBAL_PREFIX}/users`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          fullName: 'Duplicate User',
          email: 'finance-test@agilix.id',
          password: 'Finance@Test123',
          role: UserRole.FINANCE_ADMIN,
        })
        .expect(409);
    });

    it('harus mengembalikan 400 saat email tidak valid', async () => {
      await request(app.getHttpServer() as Server)
        .post(`/${GLOBAL_PREFIX}/users`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          fullName: 'Bad Email User',
          email: 'bukan-email',
          password: 'Finance@Test123',
          role: UserRole.FINANCE_ADMIN,
        })
        .expect(400);
    });

    it('harus mengembalikan 400 saat password kurang dari 8 karakter', async () => {
      await request(app.getHttpServer() as Server)
        .post(`/${GLOBAL_PREFIX}/users`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          fullName: 'Short Pass User',
          email: 'shortpass@agilix.id',
          password: '123',
          role: UserRole.FINANCE_ADMIN,
        })
        .expect(400);
    });

    it('harus mengembalikan 400 saat role tidak valid', async () => {
      await request(app.getHttpServer() as Server)
        .post(`/${GLOBAL_PREFIX}/users`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          fullName: 'Bad Role User',
          email: 'badrole@agilix.id',
          password: 'Finance@Test123',
          role: 'INVALID_ROLE',
        })
        .expect(400);
    });

    it('harus mengembalikan 401 tanpa token', async () => {
      await request(app.getHttpServer() as Server)
        .post(`/${GLOBAL_PREFIX}/users`)
        .send({
          fullName: 'No Auth User',
          email: 'noauth@agilix.id',
          password: 'Finance@Test123',
          role: UserRole.FINANCE_ADMIN,
        })
        .expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /users
  // ---------------------------------------------------------------------------
  describe('GET /users', () => {
    it('harus mengembalikan paginated list users', async () => {
      const res = await request(app.getHttpServer() as Server)
        .get(`/${GLOBAL_PREFIX}/users`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as UserListBody;
      expect(body.success).toBe(true);
      expect(body.data.items).toBeDefined();
      expect(Array.isArray(body.data.items)).toBe(true);
      expect(body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('harus mengembalikan hasil filter berdasarkan search', async () => {
      const res = await request(app.getHttpServer() as Server)
        .get(`/${GLOBAL_PREFIX}/users?search=finance-test`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as UserListBody;
      expect(body.data.items.length).toBeGreaterThanOrEqual(1);
    });

    it('harus mengembalikan 401 tanpa token', async () => {
      await request(app.getHttpServer() as Server)
        .get(`/${GLOBAL_PREFIX}/users`)
        .expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /users/:id
  // ---------------------------------------------------------------------------
  describe('GET /users/:id', () => {
    it('harus mengembalikan detail user berdasarkan id', async () => {
      const res = await request(app.getHttpServer() as Server)
        .get(`/${GLOBAL_PREFIX}/users/${createdUserId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as UserResponseBody;
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(createdUserId);
    });

    it('harus mengembalikan 404 jika user tidak ada', async () => {
      await request(app.getHttpServer() as Server)
        .get(`/${GLOBAL_PREFIX}/users/aaaaaaaa-0000-4000-8000-aaaaaaaaaaaa`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);
    });

    it('harus mengembalikan 400 jika id bukan UUID valid', async () => {
      await request(app.getHttpServer() as Server)
        .get(`/${GLOBAL_PREFIX}/users/bukan-uuid`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /users/:id
  // ---------------------------------------------------------------------------
  describe('PATCH /users/:id', () => {
    it('harus berhasil update fullName user', async () => {
      const res = await request(app.getHttpServer() as Server)
        .patch(`/${GLOBAL_PREFIX}/users/${createdUserId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ fullName: 'Finance User Updated' })
        .expect(200);

      const body = res.body as UserResponseBody;
      expect(body.success).toBe(true);
      expect(body.data.fullName).toBe('Finance User Updated');
    });

    it('harus mengembalikan 404 jika user tidak ada', async () => {
      await request(app.getHttpServer() as Server)
        .patch(`/${GLOBAL_PREFIX}/users/aaaaaaaa-0000-4000-8000-aaaaaaaaaaaa`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ fullName: 'Ghost User' })
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /users/:id/deactivate
  // ---------------------------------------------------------------------------
  describe('PATCH /users/:id/deactivate', () => {
    it('harus berhasil deactivate user', async () => {
      const res = await request(app.getHttpServer() as Server)
        .patch(`/${GLOBAL_PREFIX}/users/${createdUserId}/deactivate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as UserResponseBody;
      expect(body.success).toBe(true);
      expect(body.data.isActive).toBe(false);
    });

    it('harus mengembalikan 401 saat user yang dinonaktifkan mencoba login', async () => {
      await request(app.getHttpServer() as Server)
        .post(`/${GLOBAL_PREFIX}/auth/login`)
        .send({
          email: 'finance-test@agilix.id',
          password: 'Finance@Test123',
        })
        .expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /users/:id
  // ---------------------------------------------------------------------------
  describe('DELETE /users/:id', () => {
    it('harus berhasil soft delete user', async () => {
      const res = await request(app.getHttpServer() as Server)
        .delete(`/${GLOBAL_PREFIX}/users/${createdUserId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as { success: boolean };
      expect(body.success).toBe(true);
    });

    it('harus mengembalikan 404 setelah user di-delete', async () => {
      await request(app.getHttpServer() as Server)
        .get(`/${GLOBAL_PREFIX}/users/${createdUserId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);
    });
  });
});
