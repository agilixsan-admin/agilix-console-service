import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Invoice } from '../../models/invoice.model';
import { Tenant } from '../../models/tenant.model';
import { InvoiceRepository } from '../../repositories/modules/invoice.repository';
import { TenantRepository } from '../../repositories/modules/tenant.repository';
import { InvoiceService } from '../../service/modules/invoices/invoice.service';
import { InvoiceSchedulerService } from '../../service/modules/invoices/invoice-scheduler.service';
import { InvoiceController } from '../../controllers/modules/invoices/invoice.controller';
import { AuditLogModule } from './audit-log.module';
import { RealtimeModule } from './realtime.module';
import { INVOICE_REMINDER_QUEUE } from '../../queues/jobs/invoice-reminder.job';
import { INVOICE_OVERDUE_QUEUE } from '../../queues/jobs/invoice-overdue.job';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Tenant]),
    BullModule.registerQueue(
      { name: INVOICE_REMINDER_QUEUE },
      { name: INVOICE_OVERDUE_QUEUE },
    ),
    AuditLogModule,
    RealtimeModule,
  ],
  controllers: [InvoiceController],
  providers: [
    InvoiceRepository,
    TenantRepository,
    InvoiceService,
    InvoiceSchedulerService,
  ],
  exports: [InvoiceService, InvoiceRepository],
})
export class InvoiceModule {}
