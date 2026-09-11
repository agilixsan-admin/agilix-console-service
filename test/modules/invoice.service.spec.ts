import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { InvoiceService } from '../../src/service/modules/invoices/invoice.service';
import { InvoiceRepository } from '../../src/repositories/modules/invoice.repository';
import { TenantRepository } from '../../src/repositories/modules/tenant.repository';
import { EmailTemplateRepository } from '../../src/repositories/modules/email-template.repository';
import { NotificationService } from '../../src/service/modules/notifications/notification.service';
import { InvoicePdfService } from '../../src/service/modules/invoices/invoice-pdf.service';
import { AuditLogService } from '../../src/service/modules/audit-logs/audit-log.service';
import { EventPublisherService } from '../../src/events/event-publisher.service';
import { INVOICE_REMINDER_QUEUE } from '../../src/queues/jobs/invoice-reminder.job';
import {
  EMAIL_NOTIFICATION_QUEUE,
  EMAIL_NOTIFICATION_JOB,
} from '../../src/queues/jobs/email-notification.job';
import { InvoiceStatus } from '../../src/types/enums/invoice-status.enum';
import { AuditAction } from '../../src/types/enums/audit-action.enum';
import { NotificationType } from '../../src/types/enums/notification-type.enum';
import {
  TEST_INVOICE_ID,
  TEST_TENANT_ID,
  TEST_USER_ID,
  TEST_BILLING_PERIOD,
  TEST_INVOICE_AMOUNT,
  TEST_PAID_AT,
} from '../config/constants';
import {
  buildInvoice,
  buildTenant,
  buildPaginatedResult,
  mockInvoiceRepository,
  mockTenantRepository,
  mockEmailTemplateRepository,
  mockNotificationService,
  mockInvoicePdfService,
  mockAuditLogService,
  mockEventPublisherService,
  mockEmailQueue,
} from '../config/functionUnitTest';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let repository: ReturnType<typeof mockInvoiceRepository>;
  let tenantRepository: ReturnType<typeof mockTenantRepository>;
  let emailTemplateRepo: ReturnType<typeof mockEmailTemplateRepository>;
  let notificationService: ReturnType<typeof mockNotificationService>;
  let invoicePdfService: ReturnType<typeof mockInvoicePdfService>;
  let auditLogService: ReturnType<typeof mockAuditLogService>;
  let eventPublisher: ReturnType<typeof mockEventPublisherService>;
  let emailQueue: ReturnType<typeof mockEmailQueue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        { provide: InvoiceRepository, useFactory: mockInvoiceRepository },
        { provide: TenantRepository, useFactory: mockTenantRepository },
        {
          provide: EmailTemplateRepository,
          useFactory: mockEmailTemplateRepository,
        },
        { provide: NotificationService, useFactory: mockNotificationService },
        { provide: InvoicePdfService, useFactory: mockInvoicePdfService },
        { provide: AuditLogService, useFactory: mockAuditLogService },
        {
          provide: EventPublisherService,
          useFactory: mockEventPublisherService,
        },
        {
          provide: getQueueToken(INVOICE_REMINDER_QUEUE),
          useFactory: mockEmailQueue,
        },
        {
          provide: getQueueToken(EMAIL_NOTIFICATION_QUEUE),
          useFactory: mockEmailQueue,
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    repository = module.get(InvoiceRepository);
    tenantRepository = module.get(TenantRepository);
    emailTemplateRepo = module.get(EmailTemplateRepository);
    notificationService = module.get(NotificationService);
    invoicePdfService = module.get(InvoicePdfService);
    auditLogService = module.get(AuditLogService);
    eventPublisher = module.get(EventPublisherService);
    emailQueue = module.get(getQueueToken(EMAIL_NOTIFICATION_QUEUE));
  });

  afterEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // findAll
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('harus mengembalikan paginated result dari repository', async () => {
      const paginated = buildPaginatedResult([buildInvoice()]);
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
    it('harus mengembalikan invoice jika ditemukan', async () => {
      const invoice = buildInvoice();
      repository.findById.mockResolvedValue(invoice);

      const result = await service.findById(TEST_INVOICE_ID);

      expect(result).toEqual(invoice);
    });

    it('harus throw NotFoundException jika invoice tidak ada', async () => {
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
      amount: TEST_INVOICE_AMOUNT,
      billingPeriod: TEST_BILLING_PERIOD,
      dueDate: '2026-08-30',
    };

    it('harus membuat invoice, memanggil AuditLogService, dan mempublish SSE event', async () => {
      const invoice = buildInvoice();
      repository.countByBillingPeriod.mockResolvedValue(0);
      repository.create.mockResolvedValue(invoice);
      auditLogService.log.mockResolvedValue(undefined);

      const result = await service.create(createDto, TEST_USER_ID);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: createDto.tenantId,
          status: InvoiceStatus.PENDING,
          paidAt: null,
        }),
      );
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.INVOICE_CREATED }),
      );
      expect(eventPublisher.publishInvoiceGenerated).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceId: invoice.id,
          tenantId: invoice.tenantId,
        }),
      );
      expect(result).toEqual(invoice);
    });

    it('harus membuat invoice number dengan format INV-YYYYMM-XXXX', async () => {
      const invoice = buildInvoice();
      repository.countByBillingPeriod.mockResolvedValue(2);
      repository.create.mockResolvedValue(invoice);
      auditLogService.log.mockResolvedValue(undefined);

      await service.create(createDto, TEST_USER_ID);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceNumber: 'INV-202608-0003',
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // pay
  // -------------------------------------------------------------------------

  describe('pay', () => {
    const payDto = { paidAt: TEST_PAID_AT.toISOString() };

    it('harus membayar invoice, memanggil AuditLogService, mempublish payment.received, dan mengirim email konfirmasi pembayaran dengan lampiran PDF', async () => {
      const invoice = buildInvoice({ status: InvoiceStatus.PENDING });
      const paid = buildInvoice({
        status: InvoiceStatus.PAID,
        paidAt: TEST_PAID_AT,
      });
      const tenant = buildTenant({ id: TEST_TENANT_ID });
      repository.findById.mockResolvedValue(invoice);
      repository.update.mockResolvedValue(paid);
      tenantRepository.findById.mockResolvedValue(tenant);
      auditLogService.log.mockResolvedValue(undefined);

      const result = await service.pay(TEST_INVOICE_ID, payDto, TEST_USER_ID);

      expect(repository.update).toHaveBeenCalledWith(
        TEST_INVOICE_ID,
        expect.objectContaining({ status: InvoiceStatus.PAID }),
      );
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.INVOICE_PAID }),
      );
      expect(eventPublisher.publishPaymentReceived).toHaveBeenCalledWith(
        expect.objectContaining({ invoiceId: TEST_INVOICE_ID }),
      );
      expect(emailTemplateRepo.render).toHaveBeenCalledWith(
        'invoice-paid',
        expect.objectContaining({
          invoiceNumber: paid.invoiceNumber,
          ownerName: tenant.ownerName,
        }),
      );
      expect(invoicePdfService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceNumber: paid.invoiceNumber,
          status: InvoiceStatus.PAID,
        }),
      );
      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: paid.tenantId,
          type: NotificationType.PAYMENT_CONFIRMATION,
        }),
      );
      expect(emailQueue.add).toHaveBeenCalledWith(
        EMAIL_NOTIFICATION_JOB,
        expect.objectContaining({
          recipient: tenant.ownerEmail,
          attachments: [
            expect.objectContaining({
              filename: `${paid.invoiceNumber}-LUNAS.pdf`,
              contentType: 'application/pdf',
            }),
          ],
        }),
        expect.any(Object),
      );
      expect(result.status).toBe(InvoiceStatus.PAID);
    });

    it('harus throw BadRequestException jika invoice sudah PAID', async () => {
      repository.findById.mockResolvedValue(
        buildInvoice({ status: InvoiceStatus.PAID }),
      );

      await expect(
        service.pay(TEST_INVOICE_ID, payDto, TEST_USER_ID),
      ).rejects.toThrow(BadRequestException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('harus throw BadRequestException jika invoice berstatus CANCELLED', async () => {
      repository.findById.mockResolvedValue(
        buildInvoice({ status: InvoiceStatus.CANCELLED }),
      );

      await expect(
        service.pay(TEST_INVOICE_ID, payDto, TEST_USER_ID),
      ).rejects.toThrow(BadRequestException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('harus throw NotFoundException jika invoice tidak ada', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.pay('nonexistent-id', payDto, TEST_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // cancel
  // -------------------------------------------------------------------------

  describe('cancel', () => {
    it('harus membatalkan invoice, memanggil AuditLogService, dan mempublish invoice.cancelled', async () => {
      const invoice = buildInvoice({ status: InvoiceStatus.PENDING });
      const cancelled = buildInvoice({ status: InvoiceStatus.CANCELLED });
      repository.findById.mockResolvedValue(invoice);
      repository.update.mockResolvedValue(cancelled);
      auditLogService.log.mockResolvedValue(undefined);

      const result = await service.cancel(TEST_INVOICE_ID, TEST_USER_ID);

      expect(repository.update).toHaveBeenCalledWith(TEST_INVOICE_ID, {
        status: InvoiceStatus.CANCELLED,
      });
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.INVOICE_CANCELLED }),
      );
      expect(eventPublisher.publishInvoiceCancelled).toHaveBeenCalledWith({
        invoiceId: TEST_INVOICE_ID,
        tenantId: invoice.tenantId,
      });
      expect(result.status).toBe(InvoiceStatus.CANCELLED);
    });

    it('harus throw BadRequestException jika invoice berstatus PAID', async () => {
      repository.findById.mockResolvedValue(
        buildInvoice({ status: InvoiceStatus.PAID }),
      );

      await expect(
        service.cancel(TEST_INVOICE_ID, TEST_USER_ID),
      ).rejects.toThrow(BadRequestException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('harus throw BadRequestException jika invoice sudah CANCELLED', async () => {
      repository.findById.mockResolvedValue(
        buildInvoice({ status: InvoiceStatus.CANCELLED }),
      );

      await expect(
        service.cancel(TEST_INVOICE_ID, TEST_USER_ID),
      ).rejects.toThrow(BadRequestException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('harus throw NotFoundException dan tidak memanggil update jika invoice tidak ada', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.cancel('nonexistent-id', TEST_USER_ID),
      ).rejects.toThrow(NotFoundException);

      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});
