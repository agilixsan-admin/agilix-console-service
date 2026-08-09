import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from '../../src/service/modules/audit-logs/audit-log.service';
import { AuditLogRepository } from '../../src/repositories/modules/audit-log.repository';
import { AuditAction } from '../../src/types/enums/audit-action.enum';
import {
  TEST_AUDIT_LOG_ID,
  TEST_USER_ID,
  TEST_TENANT_ID,
} from '../config/constants';
import {
  buildAuditLog,
  buildPaginatedResult,
  mockAuditLogRepository,
} from '../config/functionUnitTest';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let repository: ReturnType<typeof mockAuditLogRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: AuditLogRepository, useFactory: mockAuditLogRepository },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    repository = module.get(AuditLogRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('log', () => {
    it('harus memanggil repository.create dengan data yang benar', async () => {
      repository.create.mockResolvedValue(buildAuditLog());

      await service.log({
        actorId: TEST_USER_ID,
        tenantId: TEST_TENANT_ID,
        action: AuditAction.TENANT_CREATED,
        targetType: 'Tenant',
        targetId: TEST_TENANT_ID,
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: TEST_USER_ID,
          action: AuditAction.TENANT_CREATED,
          targetType: 'Tenant',
        }),
      );
    });

    it('harus berhasil menyimpan log tanpa tenantId (nullable)', async () => {
      repository.create.mockResolvedValue(buildAuditLog({ tenantId: null }));

      await service.log({
        actorId: TEST_USER_ID,
        action: AuditAction.USER_CREATED,
        targetType: 'User',
        targetId: TEST_USER_ID,
      });

      expect(repository.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('harus mengembalikan paginated result dari repository', async () => {
      const paginated = buildPaginatedResult([buildAuditLog()]);
      repository.findAll.mockResolvedValue(paginated);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
      expect(result).toEqual(paginated);
    });

    it('harus meneruskan filter actorId, tenantId, action ke repository', async () => {
      repository.findAll.mockResolvedValue(buildPaginatedResult([]));

      await service.findAll({
        page: 1,
        limit: 10,
        actorId: TEST_USER_ID,
        tenantId: TEST_TENANT_ID,
        action: AuditAction.TENANT_LOCKED,
      });

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: TEST_USER_ID,
          tenantId: TEST_TENANT_ID,
          action: AuditAction.TENANT_LOCKED,
        }),
      );
    });
  });

  describe('findById', () => {
    it('harus mengembalikan audit log jika ditemukan', async () => {
      const log = buildAuditLog();
      repository.findById.mockResolvedValue(log);

      const result = await service.findById(TEST_AUDIT_LOG_ID);

      expect(repository.findById).toHaveBeenCalledWith(TEST_AUDIT_LOG_ID);
      expect(result).toEqual(log);
    });

    it('harus throw NotFoundException jika audit log tidak ditemukan', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
