import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../../../models/invoice.model';
import { InvoiceRepository } from '../../../repositories/modules/invoice.repository';
import { InvoiceService } from '../../service/modules/invoices/invoice.service';
import { InvoiceController } from '../../controllers/modules/invoices/invoice.controller';
import { AuditLogModule } from './audit-log.module';
import { RealtimeModule } from './realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice]),
    AuditLogModule,
    RealtimeModule,
  ],
  controllers: [InvoiceController],
  providers: [InvoiceRepository, InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
