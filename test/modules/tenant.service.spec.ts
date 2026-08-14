import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from '../../src/service/modules/tenants/tenant.service';
import { TenantRepository } from '../../src/repositories/modules/tenant.repository';
import { AuditLogService } from '../../src/service/modules/audit-logs/audit-log.service';
import { EventPublisherService } from '../../src/events/event-publisher.service';
import { TenantStatus } from '../../src/types/enums/tenant-status.enum';
import { PlanType } from '../../src/types/enums/plan-type.enum';
import { AuditAction } from '../../src/types/enums/audit-action.enum';
import {
  TEST_TENANT_ID,
  TEST_USER_ID,
  FUTURE_EXPIRY_DATE,
  PAST_EXPIRY_DATE,
  TEST_BUSINESS_NAME,
} from '../config/constants';
import {
  buildTenant,
  buildPaginatedResult,
  mockTenantRepository,
  mockAuditLogService,
  mockEventPublisherService,
} from '../config/functionUnitTest';

describe('TenantService', () => {
  let service: TenantService;
  let repository: ReturnType<typeof mockTenantRepository>;
  let auditLogService: ReturnType<typeof mockAuditLogService>;
  let eventPublisher: ReturnType<typeof mockEventPublisherService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: TenantRepository, useFactory: mockTenantRepository },
        { provide: AuditLogService, useFactory: mockAuditLogService },
        {
          provide: EventPublisherService,
          useFactory: mockEventPublisherService,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    repository = module.get(TenantRepository);
    auditLogService = module.get(AuditLogService);
    eventPublisher = module.get(EventPublisherService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('harus mengembalikan paginated result dari repository', async () => {
      const paginated = buildPaginatedResult([buildTenant()]);
      repository.findAll.mockResolvedValue(paginated);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
      expect(result).toEqual(paginated);
    });
  });

  describe('findById', () => {
    it('harus mengembalikan tenant jika ditemukan', async () => {
      const tenant = buildTenant();
      repository.findById.mockResolvedValue(tenant);

      const result = await service.findById(TEST_TENANT_ID);

      expect(result).toEqual(tenant);
    });

    it('harus throw NotFoundException jika tenant tidak ada', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto = {
      businessName: TEST_BUSINESS_NAME,
      ownerName: 'John Doe',
      ownerEmail: 'owner@example.com',
      planType: PlanType.MONTHLY,
      outletCount: 3,
      expiryDate: FUTURE_EXPIRY_DATE.toISOString().split('T')[0],
    };

    it('harus membuat tenant dan memanggil AuditLogService', async () => {
      const tenant = buildTenant();
      repository.create.mockResolvedValue(tenant);
      auditLogService.log.mockResolvedValue(undefined);

      const result = await service.create(createDto, TEST_USER_ID);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          businessName: createDto.businessName,
          status: TenantStatus.ACTIVE,
          createdBy: TEST_USER_ID,
        }),
      );
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.TENANT_CREATED }),
      );
      expect(result).toEqual(tenant);
    });

    it('harus throw BadRequestException jika expiryDate sudah lewat', async () => {
      await expect(
        service.create(
          {
            ...createDto,
            expiryDate: PAST_EXPIRY_DATE.toISOString().split('T')[0],
          },
          TEST_USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('harus mengupdate tenant dan memanggil AuditLogService', async () => {
      const tenant = buildTenant();
      const updated = buildTenant({ businessName: 'Updated Store' });
      repository.findById.mockResolvedValue(tenant);
      repository.update.mockResolvedValue(updated);
      auditLogService.log.mockResolvedValue(undefined);

      const result = await service.update(
        TEST_TENANT_ID,
        { businessName: 'Updated Store' },
        TEST_USER_ID,
      );

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.TENANT_UPDATED }),
      );
      expect(result.businessName).toBe('Updated Store');
    });

    it('harus throw NotFoundException jika tenant tidak ada', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', {}, TEST_USER_ID),
      ).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('lock', () => {
    it('harus mengunci tenant, memanggil AuditLogService, dan mempublish SSE event', async () => {
      const tenant = buildTenant({ status: TenantStatus.ACTIVE });
      const locked = buildTenant({ status: TenantStatus.LOCKED });
      repository.findById.mockResolvedValue(tenant);
      repository.update.mockResolvedValue(locked);
      auditLogService.log.mockResolvedValue(undefined);

      const result = await service.lock(TEST_TENANT_ID, TEST_USER_ID);

      expect(repository.update).toHaveBeenCalledWith(TEST_TENANT_ID, {
        status: TenantStatus.LOCKED,
      });
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.TENANT_LOCKED }),
      );
      expect(eventPublisher.publishTenantLocked).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TEST_TENANT_ID,
          lockedBy: TEST_USER_ID,
        }),
      );
      expect(result.status).toBe(TenantStatus.LOCKED);
    });

    it('harus throw BadRequestException jika tenant sudah terkunci', async () => {
      repository.findById.mockResolvedValue(
        buildTenant({ status: TenantStatus.LOCKED }),
      );

      await expect(service.lock(TEST_TENANT_ID, TEST_USER_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('harus throw NotFoundException jika tenant tidak ada', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.lock('nonexistent-id', TEST_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unlock', () => {
    it('harus membuka kunci tenant, memanggil AuditLogService, dan mempublish SSE event', async () => {
      const tenant = buildTenant({ status: TenantStatus.LOCKED });
      const unlocked = buildTenant({ status: TenantStatus.ACTIVE });
      repository.findById.mockResolvedValue(tenant);
      repository.update.mockResolvedValue(unlocked);
      auditLogService.log.mockResolvedValue(undefined);

      const result = await service.unlock(TEST_TENANT_ID, TEST_USER_ID);

      expect(repository.update).toHaveBeenCalledWith(TEST_TENANT_ID, {
        status: TenantStatus.ACTIVE,
      });
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.TENANT_UNLOCKED }),
      );
      expect(eventPublisher.publishTenantUnlocked).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TEST_TENANT_ID,
          unlockedBy: TEST_USER_ID,
        }),
      );
      expect(result.status).toBe(TenantStatus.ACTIVE);
    });

    it('harus throw BadRequestException jika tenant tidak sedang terkunci', async () => {
      repository.findById.mockResolvedValue(
        buildTenant({ status: TenantStatus.ACTIVE }),
      );

      await expect(
        service.unlock(TEST_TENANT_ID, TEST_USER_ID),
      ).rejects.toThrow(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('harus softDelete tenant dan memanggil AuditLogService', async () => {
      repository.findById.mockResolvedValue(buildTenant());
      repository.softDelete.mockResolvedValue(undefined);
      auditLogService.log.mockResolvedValue(undefined);

      await service.remove(TEST_TENANT_ID, TEST_USER_ID);

      expect(repository.softDelete).toHaveBeenCalledWith(TEST_TENANT_ID);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.TENANT_DELETED }),
      );
    });

    it('harus throw NotFoundException dan tidak memanggil softDelete jika tenant tidak ada', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent-id', TEST_USER_ID),
      ).rejects.toThrow(NotFoundException);
      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });
});
