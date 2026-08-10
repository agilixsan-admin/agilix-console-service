import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../../models/tenant.model';
import { Invoice } from '../../models/invoice.model';
import { PosDevice } from '../../models/pos-device.model';
import { TenantRepository } from '../../repositories/modules/tenant.repository';
import { InvoiceRepository } from '../../repositories/modules/invoice.repository';
import { PosDeviceRepository } from '../../repositories/modules/pos-device.repository';
import { DashboardService } from '../../service/modules/dashboard/dashboard.service';
import { DashboardController } from '../../controllers/modules/dashboard/dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Invoice, PosDevice])],
  controllers: [DashboardController],
  providers: [
    TenantRepository,
    InvoiceRepository,
    PosDeviceRepository,
    DashboardService,
  ],
})
export class DashboardModule {}
