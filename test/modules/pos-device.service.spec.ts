import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PosDeviceService } from '../../src/service/modules/pos-devices/pos-device.service';
import { PosDeviceRepository } from '../../src/repositories/modules/pos-device.repository';
import { AuditLogService } from '../../src/service/modules/audit-logs/audit-log.service';
import { EventPublisherService } from '../../src/events/event-publisher.service';
import { DeviceStatus } from '../../src/types/enums/device-status.enum';
import { AuditAction } from '../../src/types/enums/audit-action.enum';
import {
  TEST_DEVICE_ID,
  TEST_TENANT_ID,
  TEST_USER_ID,
  TEST_DEVICE_CODE,
  TEST_DEVICE_NAME,
} from '../config/constants';
import {
  buildPosDevice,
  buildPaginatedResult,
  mockPosDeviceRepository,
  mockAuditLogService,
  mockEventPublisherService,
} from '../config/functionUnitTest';

describe('PosDeviceService', () => {
  let service: PosDeviceService;
  let repository: ReturnType<typeof mockPosDeviceRepository>;
  let auditLogService: ReturnType<typeof mockAuditLogService>;
  let eventPublisher: ReturnType<typeof mockEventPublisherService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosDeviceService,
        { provide: PosDeviceRepository, useFactory: mockPosDeviceRepository },
        { provide: AuditLogService, useFactory: mockAuditLogService },
        {
          provide: EventPublisherService,
          useFactory: mockEventPublisherService,
        },
      ],
    }).compile();

    service = module.get<PosDeviceService>(PosDeviceService);
    repository = module.get(PosDeviceRepository);
    auditLogService = module.get(AuditLogService);
    eventPublisher = module.get(EventPublisherService);
  });

  afterEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // findAll
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('harus mengembalikan paginated result dari repository', async () => {
      const paginated = buildPaginatedResult([buildPosDevice()]);
      repository.findAll.mockResolvedValue(paginated);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
      expect(result).toEqual(paginated);
    });
  });

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------

  describe('findById', () => {
    it('harus mengembalikan device jika ditemukan', async () => {
      const device = buildPosDevice();
      repository.findById.mockResolvedValue(device);

      const result = await service.findById(TEST_DEVICE_ID);

      expect(result).toEqual(device);
    });

    it('harus throw NotFoundException jika device tidak ada', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  describe('create', () => {
    const createDto = {
      tenantId: TEST_TENANT_ID,
      deviceCode: TEST_DEVICE_CODE,
      deviceName: TEST_DEVICE_NAME,
    };

    it('harus membuat device, memanggil AuditLogService, dan mempublish device.registered', async () => {
      const device = buildPosDevice();
      repository.findByDeviceCode.mockResolvedValue(null);
      repository.create.mockResolvedValue(device);
      auditLogService.log.mockResolvedValue(undefined);

      const result = await service.create(createDto, TEST_USER_ID);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceCode: TEST_DEVICE_CODE,
          status: DeviceStatus.OFFLINE,
          isLocked: false,
        }),
      );
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.DEVICE_REGISTERED }),
      );
      expect(eventPublisher.publishDeviceRegistered).toHaveBeenCalledWith({
        deviceId: device.id,
        tenantId: device.tenantId,
      });
      expect(result).toEqual(device);
    });

    it('harus throw ConflictException jika deviceCode sudah ada', async () => {
      repository.findByDeviceCode.mockResolvedValue(buildPosDevice());

      await expect(service.create(createDto, TEST_USER_ID)).rejects.toThrow(
        ConflictException,
      );

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------

  describe('update', () => {
    it('harus mengupdate device dan memanggil AuditLogService', async () => {
      const device = buildPosDevice();
      const updated = buildPosDevice({ deviceName: 'Kasir Baru' });
      repository.findById.mockResolvedValue(device);
      repository.update.mockResolvedValue(updated);
      auditLogService.log.mockResolvedValue(undefined);

      const result = await service.update(
        TEST_DEVICE_ID,
        { deviceName: 'Kasir Baru' },
        TEST_USER_ID,
      );

      expect(repository.update).toHaveBeenCalledWith(
        TEST_DEVICE_ID,
        expect.objectContaining({ deviceName: 'Kasir Baru' }),
      );
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.DEVICE_UPDATED }),
      );
      expect(result.deviceName).toBe('Kasir Baru');
    });

    it('harus throw NotFoundException jika device tidak ada', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update(TEST_DEVICE_ID, { deviceName: 'Test' }, TEST_USER_ID),
      ).rejects.toThrow(NotFoundException);

      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // heartbeat
  // -------------------------------------------------------------------------

  describe('heartbeat', () => {
    const heartbeatDto = { timestamp: '2026-08-10T03:00:00.000Z' };

    it('harus update lastSeenAt dan status menjadi ONLINE', async () => {
      const device = buildPosDevice({ status: DeviceStatus.OFFLINE });
      const updated = buildPosDevice({ status: DeviceStatus.ONLINE });
      repository.findById.mockResolvedValue(device);
      repository.update.mockResolvedValue(updated);

      const result = await service.heartbeat(TEST_DEVICE_ID, heartbeatDto);

      expect(repository.update).toHaveBeenCalledWith(
        TEST_DEVICE_ID,
        expect.objectContaining({ status: DeviceStatus.ONLINE }),
      );
      expect(result.status).toBe(DeviceStatus.ONLINE);
    });

    it('harus mempublish device.online jika sebelumnya OFFLINE', async () => {
      const device = buildPosDevice({ status: DeviceStatus.OFFLINE });
      repository.findById.mockResolvedValue(device);
      repository.update.mockResolvedValue(
        buildPosDevice({ status: DeviceStatus.ONLINE }),
      );

      await service.heartbeat(TEST_DEVICE_ID, heartbeatDto);

      expect(eventPublisher.publishDeviceOnline).toHaveBeenCalledWith(
        expect.objectContaining({ deviceId: device.id }),
      );
    });

    it('harus tidak mempublish SSE jika device sudah ONLINE', async () => {
      const device = buildPosDevice({ status: DeviceStatus.ONLINE });
      repository.findById.mockResolvedValue(device);
      repository.update.mockResolvedValue(device);

      await service.heartbeat(TEST_DEVICE_ID, heartbeatDto);

      expect(eventPublisher.publishDeviceOnline).not.toHaveBeenCalled();
    });

    it('harus throw BadRequestException jika device terkunci', async () => {
      repository.findById.mockResolvedValue(buildPosDevice({ isLocked: true }));

      await expect(
        service.heartbeat(TEST_DEVICE_ID, heartbeatDto),
      ).rejects.toThrow(BadRequestException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('harus throw NotFoundException jika device tidak ada', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.heartbeat(TEST_DEVICE_ID, heartbeatDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // remove
  // -------------------------------------------------------------------------

  describe('remove', () => {
    it('harus menghapus device dan memanggil AuditLogService', async () => {
      const device = buildPosDevice();
      repository.findById.mockResolvedValue(device);
      repository.delete.mockResolvedValue(undefined);
      auditLogService.log.mockResolvedValue(undefined);

      await service.remove(TEST_DEVICE_ID, TEST_USER_ID);

      expect(repository.delete).toHaveBeenCalledWith(TEST_DEVICE_ID);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.DEVICE_DELETED }),
      );
    });

    it('harus throw NotFoundException dan tidak memanggil delete jika device tidak ada', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.remove(TEST_DEVICE_ID, TEST_USER_ID),
      ).rejects.toThrow(NotFoundException);

      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
