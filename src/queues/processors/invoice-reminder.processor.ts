import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  INVOICE_REMINDER_QUEUE,
  InvoiceReminderJobPayload,
} from '../jobs/invoice-reminder.job';
import { NotificationService } from '../../service/modules/notifications/notification.service';
import { NotificationStatus } from '../../types/enums/notification-status.enum';
import { NotificationType } from '../../types/enums/notification-type.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  EMAIL_NOTIFICATION_QUEUE,
  EMAIL_NOTIFICATION_JOB,
  EmailNotificationJobPayload,
} from '../jobs/email-notification.job';

@Processor(INVOICE_REMINDER_QUEUE)
export class InvoiceReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(InvoiceReminderProcessor.name);

  constructor(
    private readonly notificationService: NotificationService,
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
    } = job.data;

    this.logger.log(`Processing reminder for invoice ${invoiceId}`);

    const subject = `Pengingat: Tagihan ${billingPeriod} jatuh tempo ${dueDate}`;
    const content = `Tagihan Anda sebesar Rp ${amount.toLocaleString('id-ID')} akan jatuh tempo pada ${dueDate}. Segera lakukan pembayaran.`;

    const notification = await this.notificationService.create({
      tenantId,
      type: NotificationType.REMINDER_EMAIL,
      recipient: recipientEmail,
      subject,
      content,
      status: NotificationStatus.PENDING,
    });

    const emailPayload: EmailNotificationJobPayload = {
      notificationId: notification.id,
      tenantId,
      recipient: recipientEmail,
      subject,
      content,
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
