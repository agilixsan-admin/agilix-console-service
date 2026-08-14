import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Invoice } from '../../../models/invoice.model';
import { InvoiceRepository } from '../../../repositories/modules/invoice.repository';
import { TenantRepository } from '../../../repositories/modules/tenant.repository';
import { PaginatedResult } from '../../../types/response.types';
import { CreateInvoiceDto } from '../../../dto/invoice/create-invoice.dto';
import { PayInvoiceDto } from '../../../dto/invoice/pay-invoice.dto';
import { ListInvoicesQueryDto } from '../../../dto/invoice/list-invoices-query.dto';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { EventPublisherService } from '../../../events/event-publisher.service';
import { AuditAction } from '../../../types/enums/audit-action.enum';
import { InvoiceStatus } from '../../../types/enums/invoice-status.enum';
import {
  INVOICE_REMINDER_QUEUE,
  INVOICE_REMINDER_JOB,
  InvoiceReminderJobPayload,
} from '../../../queues/jobs/invoice-reminder.job';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly auditLogService: AuditLogService,
    private readonly eventPublisher: EventPublisherService,
    @InjectQueue(INVOICE_REMINDER_QUEUE)
    private readonly reminderQueue: Queue,
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

    return updated;
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
