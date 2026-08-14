import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InvoiceRepository } from '../../../repositories/modules/invoice.repository';
import {
  INVOICE_REMINDER_QUEUE,
  INVOICE_REMINDER_JOB,
  InvoiceReminderJobPayload,
} from '../../../queues/jobs/invoice-reminder.job';
import {
  INVOICE_OVERDUE_QUEUE,
  INVOICE_OVERDUE_JOB,
  InvoiceOverdueJobPayload,
} from '../../../queues/jobs/invoice-overdue.job';
import { Invoice } from '../../../models/invoice.model';

@Injectable()
export class InvoiceSchedulerService {
  private readonly logger = new Logger(InvoiceSchedulerService.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    @InjectQueue(INVOICE_REMINDER_QUEUE)
    private readonly reminderQueue: Queue,
    @InjectQueue(INVOICE_OVERDUE_QUEUE)
    private readonly overdueQueue: Queue,
  ) {}

  /**
   * Jalan setiap hari jam 08:00.
   * Scan invoice PENDING yang jatuh tempo 3 hari ke depan → kirim reminder email.
   */
  @Cron('0 10 8 * * *', { name: 'invoice-reminder-scan' })
  async handleReminderScan(): Promise<void> {
    this.logger.log('⏰ [Cron] Starting invoice reminder scan (due in 3 days)');

    try {
      const invoices = await this.invoiceRepository.findDueForReminder(3);

      if (invoices.length === 0) {
        this.logger.log('[Cron] No invoices due for reminder today');
        return;
      }

      this.logger.log(
        `[Cron] Found ${invoices.length} invoice(s) due for reminder`,
      );

      let queued = 0;
      for (const invoice of invoices) {
        if (!invoice.tenant) {
          this.logger.warn(
            `[Cron] Invoice ${invoice.id} has no tenant, skipping`,
          );
          continue;
        }

        const payload: InvoiceReminderJobPayload =
          this.buildReminderPayload(invoice);

        await this.reminderQueue.add(INVOICE_REMINDER_JOB, payload, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          // Deduplicate: satu invoice tidak dikirim dua kali dalam satu hari
          jobId: `reminder-${invoice.id}-${new Date().toISOString().slice(0, 10)}`,
        });

        queued++;
      }

      this.logger.log(`[Cron] Reminder scan done — ${queued} job(s) queued`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[Cron] Reminder scan failed: ${msg}`);
    }
  }

  /**
   * Jalan setiap hari jam 09:00.
   * Scan invoice PENDING yang sudah melewati due date → kirim overdue email.
   */
  @Cron('0 0 10 30 * *', { name: 'invoice-overdue-scan' })
  async handleOverdueScan(): Promise<void> {
    this.logger.log('⏰ [Cron] Starting invoice overdue scan');

    try {
      const invoices = await this.invoiceRepository.findOverdue();

      if (invoices.length === 0) {
        this.logger.log('[Cron] No overdue invoices found today');
        return;
      }

      this.logger.log(`[Cron] Found ${invoices.length} overdue invoice(s)`);

      let queued = 0;
      for (const invoice of invoices) {
        if (!invoice.tenant) {
          this.logger.warn(
            `[Cron] Invoice ${invoice.id} has no tenant, skipping`,
          );
          continue;
        }

        const payload: InvoiceOverdueJobPayload =
          this.buildOverduePayload(invoice);

        await this.overdueQueue.add(INVOICE_OVERDUE_JOB, payload, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          // Deduplicate: satu invoice tidak dikirim dua kali dalam satu hari
          jobId: `overdue-${invoice.id}-${new Date().toISOString().slice(0, 10)}`,
        });

        queued++;
      }

      this.logger.log(`[Cron] Overdue scan done — ${queued} job(s) queued`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[Cron] Overdue scan failed: ${msg}`);
    }
  }

  private buildReminderPayload(invoice: Invoice): InvoiceReminderJobPayload {
    const tenant = invoice.tenant;
    return {
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
  }

  private buildOverduePayload(invoice: Invoice): InvoiceOverdueJobPayload {
    const tenant = invoice.tenant;
    return {
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
  }
}
