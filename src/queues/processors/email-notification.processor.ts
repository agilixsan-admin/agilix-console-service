import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import {
  EMAIL_NOTIFICATION_QUEUE,
  EmailNotificationJobPayload,
} from '../jobs/email-notification.job';
import { NotificationService } from '../../service/modules/notifications/notification.service';

@Processor(EMAIL_NOTIFICATION_QUEUE)
export class EmailNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailNotificationProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {
    super();

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('smtp.host'),
      port: this.configService.get<number>('smtp.port'),
      secure: this.configService.get<number>('smtp.port') === 465,
      auth: {
        user: this.configService.get<string>('smtp.username'),
        pass: this.configService.get<string>('smtp.password'),
      },
      tls: {
        rejectUnauthorized: true,
      },
    });
  }

  async process(job: Job<EmailNotificationJobPayload>): Promise<void> {
    const { notificationId, recipient, subject, content } = job.data;

    this.logger.log(`Sending email for notification ${notificationId}`);

    try {
      await this.transporter.sendMail({
        from: `AGILIX.id" <${this.configService.get<string>('smtp.from')}>`,
        to: recipient,
        subject,
        html: content,
        headers: {
          'X-Mailer': 'Agilix Mailer',
          'List-Unsubscribe': `<mailto:${this.configService.get<string>('smtp.from')}?subject=unsubscribe>`,
        },
        attachments: job.data.attachments?.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content, 'base64'),
          contentType: a.contentType,
        })),
      });

      await this.notificationService.markSent(notificationId);

      this.logger.log(
        `Email sent successfully for notification ${notificationId}`,
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to send email for notification ${notificationId}: ${reason}`,
      );

      await this.notificationService.markFailed(notificationId, reason);

      throw error;
    }
  }
}
