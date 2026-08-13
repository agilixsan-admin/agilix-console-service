import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INVOICE_OVERDUE_QUEUE } from './jobs/invoice-overdue.job';
import { INVOICE_REMINDER_QUEUE } from './jobs/invoice-reminder.job';
import { EMAIL_NOTIFICATION_QUEUE } from './jobs/email-notification.job';
import { InvoiceOverdueProcessor } from './processors/invoice-overdue.processor';
import { InvoiceReminderProcessor } from './processors/invoice-reminder.processor';
import { EmailNotificationProcessor } from './processors/email-notification.processor';
import { RealtimeModule } from '../routes/modules/realtime.module';
import { NotificationModule } from '../routes/modules/notification.module';
import { EmailTemplate } from '../models/email-template.model';
import { EmailTemplateRepository } from '../repositories/modules/email-template.repository';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host') ?? 'localhost',
          port: config.get<number>('redis.port') ?? 6379,
          password: config.get<string>('redis.password') || undefined,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: INVOICE_OVERDUE_QUEUE },
      { name: INVOICE_REMINDER_QUEUE },
      { name: EMAIL_NOTIFICATION_QUEUE },
    ),
    TypeOrmModule.forFeature([EmailTemplate]),
    RealtimeModule,
    NotificationModule,
  ],
  providers: [
    InvoiceOverdueProcessor,
    InvoiceReminderProcessor,
    EmailNotificationProcessor,
    EmailTemplateRepository,
  ],
  exports: [BullModule],
})
export class QueuesModule {}
