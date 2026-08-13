import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import {
  INVOICE_REMINDER_QUEUE,
  InvoiceReminderJobPayload,
} from '../jobs/invoice-reminder.job';
import {
  EMAIL_NOTIFICATION_QUEUE,
  EMAIL_NOTIFICATION_JOB,
  EmailNotificationJobPayload,
} from '../jobs/email-notification.job';
import { NotificationService } from '../../service/modules/notifications/notification.service';
import { NotificationStatus } from '../../types/enums/notification-status.enum';
import { NotificationType } from '../../types/enums/notification-type.enum';
import { EmailTemplateRepository } from '../../repositories/modules/email-template.repository';
import { InvoicePdfService } from '../../service/modules/invoices/invoice-pdf.service';

@Processor(INVOICE_REMINDER_QUEUE)
export class InvoiceReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(InvoiceReminderProcessor.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly emailTemplateRepository: EmailTemplateRepository,
    private readonly invoicePdfService: InvoicePdfService,
    @InjectQueue(EMAIL_NOTIFICATION_QUEUE)
    private readonly emailQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<InvoiceReminderJobPayload>): Promise<void> {
    const {
      invoiceId,
      tenantId,
      recipientEmail,
      billingPeriod,
      dueDate,
      amount,
      ownerName,
      businessName,
      invoiceNumber,
      status,
      notes,
      planType,
      outletCount,
      ownerPhone,
      issuedAt,
    } = job.data;

    this.logger.log(`Processing reminder for invoice ${invoiceId}`);

    const { subject, html } = await this.emailTemplateRepository.render(
      'invoice-reminder',
      {
        ownerName,
        businessName,
        invoiceNumber,
        billingPeriod,
        dueDate,
        amount: Number(amount).toLocaleString('id-ID'),
      },
    );

    const pdfBuffer = await this.invoicePdfService.generate({
      invoiceNumber,
      billingPeriod,
      dueDate,
      amount,
      status,
      notes,
      businessName,
      ownerName,
      ownerEmail: recipientEmail,
      ownerPhone,
      planType,
      outletCount,
      issuedAt,
    });

    const notification = await this.notificationService.create({
      tenantId,
      type: NotificationType.REMINDER_EMAIL,
      recipient: recipientEmail,
      subject,
      content: html,
      status: NotificationStatus.PENDING,
    });

    const emailPayload: EmailNotificationJobPayload = {
      notificationId: notification.id,
      tenantId,
      recipient: recipientEmail,
      subject,
      content: html,
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: pdfBuffer.toString('base64'),
          encoding: 'base64',
          contentType: 'application/pdf',
        },
      ],
    };

    await this.emailQueue.add(EMAIL_NOTIFICATION_JOB, emailPayload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    this.logger.log(
      `Reminder notification ${notification.id} queued for invoice ${invoiceId}`,
    );
  }
}
