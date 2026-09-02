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
import { PlanType } from '../../src/types/enums/plan-type.enum';
import { TenantStatus } from '../../src/types/enums/tenant-status.enum';

// ---------------------------------------------------------------------------
// Response body interfaces
// ---------------------------------------------------------------------------

interface TenantData {
  id: string;
  businessName: string;
  status: string;
  planType: string;
}

interface TenantResponseBody {
  success: boolean;
  data: TenantData;
}

interface TenantListData {
  items: TenantData[];
  total: number;
}

interface TenantListBody {
  success: boolean;
  data: TenantListData;
}

const validTenantPayload = {
  businessName: 'PT Integration Test Store',
  ownerName: 'Budi Santoso',
  ownerEmail: 'budi@integrationtest.com',
  ownerPhone: '+628123456789',
  planType: PlanType.MONTHLY,
  outletCount: 3,
  expiryDate: '2027-12-31',
  notes: 'Test tenant',
};

describe('Tenant (integration)', () => {
  let app: INestApplication;
  let superAdminToken: string;
  let createdTenantId: string;

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
  // POST /tenants
  // ---------------------------------------------------------------------------
  describe('POST /tenants', () => {
    it('harus berhasil membuat tenant baru dengan data valid', async () => {
      const res = await request(app.getHttpServer() as Server)
        .post(`/${GLOBAL_PREFIX}/tenants`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validTenantPayload)
        .expect(201);

      const body = res.body as TenantResponseBody;
      expect(body.success).toBe(true);
      expect(body.data.businessName).toBe(validTenantPayload.businessName);
      expect(body.data.status).toBe(TenantStatus.ACTIVE);
      expect(body.data.planType).toBe(PlanType.MONTHLY);

      createdTenantId = body.data.id;
    });

    it('harus mengembalikan 400 saat expiryDate di masa lalu', async () => {
      await request(app.getHttpServer() as Server)
        .post(`/${GLOBAL_PREFIX}/tenants`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          ...validTenantPayload,
          expiryDate: '2020-01-01',
          ownerEmail: 'other@test.com',
        })
        .expect(400);
    });

    it('harus mengembalikan 400 saat outletCount kurang dari 1', async () => {
      await request(app.getHttpServer() as Server)
        .post(`/${GLOBAL_PREFIX}/tenants`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          ...validTenantPayload,
          outletCount: 0,
          ownerEmail: 'other2@test.com',
        })
        .expect(400);
    });

    it('harus mengembalikan 400 saat planType tidak valid', async () => {
      await request(app.getHttpServer() as Server)
        .post(`/${GLOBAL_PREFIX}/tenants`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          ...validTenantPayload,
          planType: 'INVALID',
          ownerEmail: 'other3@test.com',
        })
        .expect(400);
    });

    it('harus mengembalikan 400 saat ownerEmail tidak valid', async () => {
      await request(app.getHttpServer() as Server)
        .post(`/${GLOBAL_PREFIX}/tenants`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ ...validTenantPayload, ownerEmail: 'bukan-email' })
        .expect(400);
    });

    it('harus mengembalikan 401 tanpa token', async () => {
      await request(app.getHttpServer() as Server)
        .post(`/${GLOBAL_PREFIX}/tenants`)
        .send(validTenantPayload)
        .expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /tenants
  // ---------------------------------------------------------------------------
  describe('GET /tenants', () => {
    it('harus mengembalikan paginated list tenants', async () => {
      const res = await request(app.getHttpServer() as Server)
        .get(`/${GLOBAL_PREFIX}/tenants`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as TenantListBody;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.items)).toBe(true);
      expect(body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('harus mengembalikan hasil filter berdasarkan status', async () => {
      const res = await request(app.getHttpServer() as Server)
        .get(`/${GLOBAL_PREFIX}/tenants?status=${TenantStatus.ACTIVE}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as TenantListBody;
      expect(body.data.items.length).toBeGreaterThanOrEqual(1);
      body.data.items.forEach((t) => {
        expect(t.status).toBe(TenantStatus.ACTIVE);
      });
    });

    it('harus mengembalikan hasil filter berdasarkan planType', async () => {
      const res = await request(app.getHttpServer() as Server)
        .get(`/${GLOBAL_PREFIX}/tenants?planType=${PlanType.MONTHLY}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as TenantListBody;
      expect(body.data.items.length).toBeGreaterThanOrEqual(1);
    });

    it('harus mengembalikan 401 tanpa token', async () => {
      await request(app.getHttpServer() as Server)
        .get(`/${GLOBAL_PREFIX}/tenants`)
        .expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /tenants/:id
  // ---------------------------------------------------------------------------
  describe('GET /tenants/:id', () => {
    it('harus mengembalikan detail tenant berdasarkan id', async () => {
      const res = await request(app.getHttpServer() as Server)
        .get(`/${GLOBAL_PREFIX}/tenants/${createdTenantId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as TenantResponseBody;
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(createdTenantId);
      expect(body.data.businessName).toBe(validTenantPayload.businessName);
    });

    it('harus mengembalikan 404 jika tenant tidak ada', async () => {
      await request(app.getHttpServer() as Server)
        .get(`/${GLOBAL_PREFIX}/tenants/aaaaaaaa-0000-4000-8000-aaaaaaaaaaaa`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);
    });

    it('harus mengembalikan 400 jika id bukan UUID valid', async () => {
      await request(app.getHttpServer() as Server)
        .get(`/${GLOBAL_PREFIX}/tenants/bukan-uuid`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /tenants/:id
  // ---------------------------------------------------------------------------
  describe('PATCH /tenants/:id', () => {
    it('harus berhasil update businessName tenant', async () => {
      const res = await request(app.getHttpServer() as Server)
        .patch(`/${GLOBAL_PREFIX}/tenants/${createdTenantId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ businessName: 'PT Integration Test Updated' })
        .expect(200);

      const body = res.body as TenantResponseBody;
      expect(body.success).toBe(true);
      expect(body.data.businessName).toBe('PT Integration Test Updated');
    });

    it('harus mengembalikan 404 jika tenant tidak ada', async () => {
      await request(app.getHttpServer() as Server)
        .patch(`/${GLOBAL_PREFIX}/tenants/aaaaaaaa-0000-4000-8000-aaaaaaaaaaaa`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ businessName: 'Ghost Tenant' })
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /tenants/:id/lock
  // ---------------------------------------------------------------------------
  describe('PATCH /tenants/:id/lock', () => {
    it('harus berhasil lock tenant yang statusnya ACTIVE', async () => {
      const res = await request(app.getHttpServer() as Server)
        .patch(`/${GLOBAL_PREFIX}/tenants/${createdTenantId}/lock`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as TenantResponseBody;
      expect(body.success).toBe(true);
      expect(body.data.status).toBe(TenantStatus.LOCKED);
    });

    it('harus mengembalikan 400 saat tenant sudah LOCKED', async () => {
      await request(app.getHttpServer() as Server)
        .patch(`/${GLOBAL_PREFIX}/tenants/${createdTenantId}/lock`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /tenants/:id/unlock
  // ---------------------------------------------------------------------------
  describe('PATCH /tenants/:id/unlock', () => {
    it('harus berhasil unlock tenant yang statusnya LOCKED', async () => {
      const res = await request(app.getHttpServer() as Server)
        .patch(`/${GLOBAL_PREFIX}/tenants/${createdTenantId}/unlock`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as TenantResponseBody;
      expect(body.success).toBe(true);
      expect(body.data.status).toBe(TenantStatus.ACTIVE);
    });

    it('harus mengembalikan 400 saat tenant tidak dalam status LOCKED', async () => {
      await request(app.getHttpServer() as Server)
        .patch(`/${GLOBAL_PREFIX}/tenants/${createdTenantId}/unlock`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /tenants/:id
  // ---------------------------------------------------------------------------
  describe('DELETE /tenants/:id', () => {
    it('harus berhasil soft delete tenant', async () => {
      const res = await request(app.getHttpServer() as Server)
        .delete(`/${GLOBAL_PREFIX}/tenants/${createdTenantId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const body = res.body as { success: boolean };
      expect(body.success).toBe(true);
    });

    it('harus mengembalikan 404 setelah tenant di-delete', async () => {
      await request(app.getHttpServer() as Server)
        .get(`/${GLOBAL_PREFIX}/tenants/${createdTenantId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);
    });
  });
});
