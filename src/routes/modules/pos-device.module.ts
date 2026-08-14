import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosDevice } from '../../models/pos-device.model';
import { Tenant } from '../../models/tenant.model';
import { PosDeviceRepository } from '../../repositories/modules/pos-device.repository';
import { TenantRepository } from '../../repositories/modules/tenant.repository';
import { PosDeviceService } from '../../service/modules/pos-devices/pos-device.service';
import { PosDeviceController } from '../../controllers/modules/pos-devices/pos-device.controller';
import { AuditLogModule } from './audit-log.module';
import { RealtimeModule } from './realtime.module';
import { WebhookDispatcherService } from '../../service/modules/webhook-dispatcher.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PosDevice, Tenant]),
    AuditLogModule,
    RealtimeModule,
  ],
  controllers: [PosDeviceController],
  providers: [
    PosDeviceRepository,
    TenantRepository,
    PosDeviceService,
    WebhookDispatcherService,
  ],
  exports: [PosDeviceService, PosDeviceRepository],
})
export class PosDeviceModule {}
