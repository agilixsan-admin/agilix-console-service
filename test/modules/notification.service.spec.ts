import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from '../../src/service/modules/notifications/notification.service';
import { NotificationRepository } from '../../src/repositories/modules/notification.repository';
import { AuditLogService } from '../../src/service/modules/audit-logs/audit-log.service';
import { EventPublisherService } from '../../src/events/event-publisher.service';
import { NotificationStatus } from '../../src/types/enums/notification-status.enum';
import { NotificationType } from '../../src/types/enums/notification-type.enum';
import { AuditAction } from '../../src/types/enums/audit-action.enum';
import {
  TEST_NOTIFICATION_ID,
  TEST_TENANT_ID,
  TEST_USER_ID,
} from '../config/constants';
import {
  buildNotification,
  buildPaginatedResult,
  mockNotificationRepository,
  mockAuditLogService,
  mockEventPublisherService,
} from '../config/functionUnitTest';

describe('NotificationService', () => {
  let service: NotificationService;
  let repository: ReturnType<typeof mockNotificationRepository>;
  let auditLogService: ReturnType<typeof mockAuditLogService>;
  let eventPublisher: ReturnType<typeof mockEventPublisherService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NotificationRepository,
          useFactory: mockNotificationRepository,
        },
        { provide: AuditLogService, useFactory: mockAuditLogService },
        {
          provide: EventPublisherService,
          useFactory: mockEventPublisherService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    repository = module.get(NotificationRepository);
    auditLogService = module.get(AuditLogService);
    eventPublisher = module.get(EventPublisherService);
  });

  afterEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // findAll
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('harus mengembalikan paginated result dari repository', async () => {
      const paginated = buildPaginatedResult([buildNotification()]);
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
    it('harus mengembalikan notification jika ditemukan', async () => {
      const notification = buildNotification();
      repository.findById.mockResolvedValue(notification);

      const result = await service.findById(TEST_NOTIFICATION_ID);

      expect(result).toEqual(notification);
    });

    it('harus throw NotFoundException jika notification tidak ada', async () => {
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
    it('harus menyimpan notification ke repository', async () => {
      const notification = buildNotification();
      repository.create.mockResolvedValue(notification);

      const data = {
        tenantId: TEST_TENANT_ID,
        type: NotificationType.INVOICE_EMAIL,
        recipient: 'owner@example.com',
        subject: 'Tagihan Bulan Ini',
        content: 'Silakan bayar sebelum jatuh tempo.',
        status: NotificationStatus.PENDING,
      };

      const result = await service.create(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(notification);
    });
  });

  // -------------------------------------------------------------------------
  // markSent
  // -------------------------------------------------------------------------

  describe('markSent', () => {
    it('harus update status SENT, memanggil AuditLogService, dan mempublish notification.sent', async () => {
      const notification = buildNotification({
        status: NotificationStatus.PENDING,
      });
      const sent = buildNotification({ status: NotificationStatus.SENT });
      repository.findById.mockResolvedValue(notification);
      repository.update.mockResolvedValue(sent);
      auditLogService.log.mockResolvedValue(undefined);

      const result = await service.markSent(TEST_NOTIFICATION_ID, TEST_USER_ID);

      expect(repository.update).toHaveBeenCalledWith(
        TEST_NOTIFICATION_ID,
        expect.objectContaining({ status: NotificationStatus.SENT }),
      );
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.NOTIFICATION_SENT }),
      );
      expect(eventPublisher.publishNotificationSent).toHaveBeenCalledWith({
        notificationId: TEST_NOTIFICATION_ID,
        channel: 'EMAIL',
      });
      expect(result.status).toBe(NotificationStatus.SENT);
    });

    it('harus throw NotFoundException jika notification tidak ada', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.markSent(TEST_NOTIFICATION_ID, TEST_USER_ID),
      ).rejects.toThrow(NotFoundException);

      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // markFailed
  // -------------------------------------------------------------------------

  describe('markFailed', () => {
    it('harus update status FAILED dan mempublish notification.failed', async () => {
      const notification = buildNotification();
      const failed = buildNotification({
        status: NotificationStatus.FAILED,
        failureReason: 'SMTP unavailable',
      });
      repository.findById.mockResolvedValue(notification);
      repository.update.mockResolvedValue(failed);

      const result = await service.markFailed(
        TEST_NOTIFICATION_ID,
        'SMTP unavailable',
      );

      expect(repository.update).toHaveBeenCalledWith(
        TEST_NOTIFICATION_ID,
        expect.objectContaining({
          status: NotificationStatus.FAILED,
          failureReason: 'SMTP unavailable',
        }),
      );
      expect(eventPublisher.publishNotificationFailed).toHaveBeenCalledWith({
        notificationId: TEST_NOTIFICATION_ID,
        reason: 'SMTP unavailable',
      });
      expect(result.status).toBe(NotificationStatus.FAILED);
    });

    it('harus throw NotFoundException jika notification tidak ada', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.markFailed(TEST_NOTIFICATION_ID, 'error'),
      ).rejects.toThrow(NotFoundException);

      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // resend
  // -------------------------------------------------------------------------

  describe('resend', () => {
    it('harus reset status ke PENDING dan memanggil AuditLogService', async () => {
      const notification = buildNotification({
        status: NotificationStatus.FAILED,
        failureReason: 'SMTP error',
      });
      const pending = buildNotification({ status: NotificationStatus.PENDING });
      repository.findById.mockResolvedValue(notification);
      repository.update.mockResolvedValue(pending);
      auditLogService.log.mockResolvedValue(undefined);

      const result = await service.resend(TEST_NOTIFICATION_ID, TEST_USER_ID);

      expect(repository.update).toHaveBeenCalledWith(
        TEST_NOTIFICATION_ID,
        expect.objectContaining({
          status: NotificationStatus.PENDING,
          failureReason: null,
        }),
      );
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.NOTIFICATION_RESENT }),
      );
      expect(result.status).toBe(NotificationStatus.PENDING);
    });

    it('harus throw NotFoundException dan tidak memanggil update jika notification tidak ada', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.resend(TEST_NOTIFICATION_ID, TEST_USER_ID),
      ).rejects.toThrow(NotFoundException);

      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});
