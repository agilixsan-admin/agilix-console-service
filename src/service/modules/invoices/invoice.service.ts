import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Invoice } from '../../../models/invoice.model';
import { InvoiceRepository } from '../../../repositories/modules/invoice.repository';
import { TenantRepository } from '../../../repositories/modules/tenant.repository';
import { EmailTemplateRepository } from '../../../repositories/modules/email-template.repository';
import { NotificationService } from '../notifications/notification.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { PaginatedResult } from '../../../types/response.types';
import { CreateInvoiceDto } from '../../../dto/invoice/create-invoice.dto';
import { PayInvoiceDto } from '../../../dto/invoice/pay-invoice.dto';
import { ListInvoicesQueryDto } from '../../../dto/invoice/list-invoices-query.dto';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { EventPublisherService } from '../../../events/event-publisher.service';
import { AuditAction } from '../../../types/enums/audit-action.enum';
import { InvoiceStatus } from '../../../types/enums/invoice-status.enum';
import { NotificationType } from '../../../types/enums/notification-type.enum';
import { NotificationStatus } from '../../../types/enums/notification-status.enum';
import {
  INVOICE_REMINDER_QUEUE,
  INVOICE_REMINDER_JOB,
  InvoiceReminderJobPayload,
} from '../../../queues/jobs/invoice-reminder.job';
import {
  EMAIL_NOTIFICATION_QUEUE,
  EMAIL_NOTIFICATION_JOB,
  EmailNotificationJobPayload,
} from '../../../queues/jobs/email-notification.job';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly emailTemplateRepository: EmailTemplateRepository,
    private readonly notificationService: NotificationService,
    private readonly invoicePdfService: InvoicePdfService,
    private readonly auditLogService: AuditLogService,
    private readonly eventPublisher: EventPublisherService,
    @InjectQueue(INVOICE_REMINDER_QUEUE)
    private readonly reminderQueue: Queue,
    @InjectQueue(EMAIL_NOTIFICATION_QUEUE)
    private readonly emailQueue: Queue,
  ) {}

  async findAll(
    query: ListInvoicesQueryDto,
  ): Promise<PaginatedResult<Invoice>> {
    return this.invoiceRepository.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      tenantId: query.tenantId,
      status: query.status,
      billingPeriod: query.billingPeriod,
    });
  }

  async findById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice with id "${id}" not found`);
    }
    return invoice;
  }

  async create(dto: CreateInvoiceDto, actorId: string): Promise<Invoice> {
    const dueDate = new Date(dto.dueDate);

    const invoiceNumber = await this.generateInvoiceNumber(dto.billingPeriod);

    const invoice = await this.invoiceRepository.create({
      tenantId: dto.tenantId,
      invoiceNumber,
      amount: dto.amount,
      billingPeriod: dto.billingPeriod,
      dueDate,
      status: InvoiceStatus.PENDING,
      notes: dto.notes ?? null,
      paidAt: null,
    });

    await this.auditLogService.log({
      actorId,
      tenantId: dto.tenantId,
      action: AuditAction.INVOICE_CREATED,
      targetType: 'Invoice',
      targetId: invoice.id,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        billingPeriod: invoice.billingPeriod,
      },
    });

    this.eventPublisher.publishInvoiceGenerated({
      invoiceId: invoice.id,
      tenantId: invoice.tenantId,
      amount: invoice.amount,
      billingPeriod: invoice.billingPeriod,
    });

    return invoice;
  }

  async pay(id: string, dto: PayInvoiceDto, actorId: string): Promise<Invoice> {
    const invoice = await this.findById(id);

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot pay a cancelled invoice');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }

    const updated = await this.invoiceRepository.update(id, {
      status: InvoiceStatus.PAID,
      paidAt: new Date(dto.paidAt),
    });

    await this.auditLogService.log({
      actorId,
      tenantId: invoice.tenantId,
      action: AuditAction.INVOICE_PAID,
      targetType: 'Invoice',
      targetId: id,
      metadata: { paidAt: dto.paidAt },
    });

    this.eventPublisher.publishPaymentReceived({
      invoiceId: id,
      tenantId: invoice.tenantId,
      amount: invoice.amount,
      paidAt: dto.paidAt,
    });

    await this.sendPaymentConfirmationEmail(updated, dto.paidAt);

    return updated;
  }

  private async sendPaymentConfirmationEmail(
    invoice: Invoice,
    paidAtStr: string,
  ): Promise<void> {
    try {
      const tenant = await this.tenantRepository.findById(invoice.tenantId);
      if (!tenant) {
        this.logger.warn(
          `Tenant "${invoice.tenantId}" not found for invoice "${invoice.id}", skipping payment confirmation email`,
        );
        return;
      }

      const formattedPaidAt = new Date(paidAtStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString(
        'id-ID',
        {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        },
      );

      const { subject, html } = await this.emailTemplateRepository.render(
        'invoice-paid',
        {
          ownerName: tenant.ownerName,
          businessName: tenant.businessName,
          invoiceNumber: invoice.invoiceNumber,
          billingPeriod: invoice.billingPeriod,
          paidAt: formattedPaidAt,
          dueDate: formattedDueDate,
          amount: Number(invoice.amount).toLocaleString('id-ID'),
        },
      );

      const pdfBuffer = await this.invoicePdfService.generate({
        invoiceNumber: invoice.invoiceNumber,
        billingPeriod: invoice.billingPeriod,
        dueDate: formattedDueDate,
        amount: Number(invoice.amount),
        status: InvoiceStatus.PAID,
        notes: invoice.notes,
        businessName: tenant.businessName,
        ownerName: tenant.ownerName,
        ownerEmail: tenant.ownerEmail,
        ownerPhone: tenant.ownerPhone,
        planType: tenant.planType,
        outletCount: tenant.outletCount,
        issuedAt: new Date(invoice.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      });

      const notification = await this.notificationService.create({
        tenantId: invoice.tenantId,
        type: NotificationType.PAYMENT_CONFIRMATION,
        recipient: tenant.ownerEmail,
        subject,
        content: html,
        status: NotificationStatus.PENDING,
      });

      const payload: EmailNotificationJobPayload = {
        notificationId: notification.id,
        tenantId: invoice.tenantId,
        recipient: tenant.ownerEmail,
        subject,
        content: html,
        attachments: [
          {
            filename: `${invoice.invoiceNumber}-LUNAS.pdf`,
            content: pdfBuffer.toString('base64'),
            encoding: 'base64',
            contentType: 'application/pdf',
          },
        ],
      };

      await this.emailQueue.add(EMAIL_NOTIFICATION_JOB, payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });

      this.logger.log(
        `Payment confirmation email queued for invoice ${invoice.id} to ${tenant.ownerEmail}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send payment confirmation email for invoice ${invoice.id}: ${(error as Error).message}`,
      );
    }
  }

  async cancel(id: string, actorId: string): Promise<Invoice> {
    const invoice = await this.findById(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot cancel a paid invoice');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Invoice is already cancelled');
    }

    const updated = await this.invoiceRepository.update(id, {
      status: InvoiceStatus.CANCELLED,
    });

    await this.auditLogService.log({
      actorId,
      tenantId: invoice.tenantId,
      action: AuditAction.INVOICE_CANCELLED,
      targetType: 'Invoice',
      targetId: id,
    });

    this.eventPublisher.publishInvoiceCancelled({
      invoiceId: id,
      tenantId: invoice.tenantId,
    });

    return updated;
  }

  private async generateInvoiceNumber(billingPeriod: string): Promise<string> {
    const [year, month] = billingPeriod.split('-');
    const prefix = `INV-${year}${month}`;

    const count =
      await this.invoiceRepository.countByBillingPeriod(billingPeriod);
    const sequence = String(count + 1).padStart(4, '0');

    return `${prefix}-${sequence}`;
  }

  /**
   * Manual trigger — kirim reminder email untuk invoice tertentu.
   * Tidak cek flag, bisa dipakai kapanpun oleh admin.
   */
  async sendReminder(id: string): Promise<void> {
    const invoice = await this.findById(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot send reminder for a paid invoice');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot send reminder for a cancelled invoice',
      );
    }

    const tenant = await this.tenantRepository.findById(invoice.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant for invoice "${id}" not found`);
    }

    const payload: InvoiceReminderJobPayload = {
      invoiceId: invoice.id,
      tenantId: invoice.tenantId,
      recipientEmail: tenant.ownerEmail,
      ownerName: tenant.ownerName,
      businessName: tenant.businessName,
      invoiceNumber: invoice.invoiceNumber,
      billingPeriod: invoice.billingPeriod,
      dueDate: new Date(invoice.dueDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      amount: Number(invoice.amount),
      status: invoice.status,
      notes: invoice.notes,
      planType: tenant.planType,
      outletCount: tenant.outletCount,
      ownerPhone: tenant.ownerPhone,
      issuedAt: invoice.createdAt.toISOString(),
    };

    await this.reminderQueue.add(INVOICE_REMINDER_JOB, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }
}
