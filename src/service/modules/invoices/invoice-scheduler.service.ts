import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CronJob } from 'cron';
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
export class InvoiceSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(InvoiceSchedulerService.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectQueue(INVOICE_REMINDER_QUEUE)
    private readonly reminderQueue: Queue,
    @InjectQueue(INVOICE_OVERDUE_QUEUE)
    private readonly overdueQueue: Queue,
  ) {}

  onModuleInit(): void {
    const reminderSchedule =
      this.configService.get<string>('cron.reminderSchedule') ?? '0 8 * * *';
    const overdueSchedule =
      this.configService.get<string>('cron.overdueSchedule') ?? '0 9 * * *';

    const reminderJob = new CronJob(reminderSchedule, () => {
      void this.handleReminderScan();
    });

    const overdueJob = new CronJob(overdueSchedule, () => {
      void this.handleOverdueScan();
    });

    this.schedulerRegistry.addCronJob('invoice-reminder-scan', reminderJob);
    this.schedulerRegistry.addCronJob('invoice-overdue-scan', overdueJob);

    reminderJob.start();
    overdueJob.start();

    this.logger.log(
      `⏰ Invoice reminder cron registered — schedule: "${reminderSchedule}"`,
    );
    this.logger.log(
      `⏰ Invoice overdue cron registered  — schedule: "${overdueSchedule}"`,
    );
  }

  /**
   * Scan invoice PENDING due H-0 sampai H-3 yang belum pernah dikirim reminder.
   * Set reminderSentAt setelah job di-enqueue supaya tidak dikirim lagi.
   */
  async handleReminderScan(): Promise<void> {
    this.logger.log(
      '⏰ [Cron] Starting invoice reminder scan (due H-0 to H-3)',
    );

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

        await this.reminderQueue.add(
          INVOICE_REMINDER_JOB,
          this.buildReminderPayload(invoice),
          { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
        );

        // Set flag supaya tidak dikirim lagi
        await this.invoiceRepository.updateFlags(invoice.id, {
          reminderSentAt: new Date(),
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
   * Scan invoice PENDING overdue yang belum pernah dikirim notifikasi.
   * Set overdueNotifiedAt setelah job di-enqueue.
   *
   * Juga scan invoice overdue yang sudah dikirim notifikasi H+3 lalu (follow-up).
   * Set overdueFollowUpAt setelah job di-enqueue.
   */
  async handleOverdueScan(): Promise<void> {
    this.logger.log('⏰ [Cron] Starting invoice overdue scan');

    try {
      // --- Notifikasi overdue pertama kali ---
      const overdueInvoices = await this.invoiceRepository.findOverdue();

      if (overdueInvoices.length > 0) {
        this.logger.log(
          `[Cron] Found ${overdueInvoices.length} overdue invoice(s) (first notification)`,
        );

        let queued = 0;
        for (const invoice of overdueInvoices) {
          if (!invoice.tenant) {
            this.logger.warn(
              `[Cron] Invoice ${invoice.id} has no tenant, skipping`,
            );
            continue;
          }

          await this.overdueQueue.add(
            INVOICE_OVERDUE_JOB,
            this.buildOverduePayload(invoice),
            { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
          );

          // Set flag supaya tidak dikirim lagi
          await this.invoiceRepository.updateFlags(invoice.id, {
            overdueNotifiedAt: new Date(),
          });

          queued++;
        }

        this.logger.log(`[Cron] Overdue scan done — ${queued} job(s) queued`);
      } else {
        this.logger.log('[Cron] No new overdue invoices today');
      }

      // --- Follow-up H+3 dari notifikasi overdue pertama ---
      const followUpInvoices =
        await this.invoiceRepository.findOverdueFollowUp();

      if (followUpInvoices.length > 0) {
        this.logger.log(
          `[Cron] Found ${followUpInvoices.length} overdue invoice(s) for H+3 follow-up`,
        );

        let queued = 0;
        for (const invoice of followUpInvoices) {
          if (!invoice.tenant) {
            this.logger.warn(
              `[Cron] Invoice ${invoice.id} has no tenant, skipping`,
            );
            continue;
          }

          await this.overdueQueue.add(
            INVOICE_OVERDUE_JOB,
            this.buildOverduePayload(invoice),
            { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
          );

          // Set flag supaya tidak dikirim lagi
          await this.invoiceRepository.updateFlags(invoice.id, {
            overdueFollowUpAt: new Date(),
          });

          queued++;
        }

        this.logger.log(`[Cron] Follow-up scan done — ${queued} job(s) queued`);
      } else {
        this.logger.log('[Cron] No overdue follow-up invoices today');
      }
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
