import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosDevice } from '../../models/pos-device.model';
import { PosDeviceRepository } from '../../repositories/modules/pos-device.repository';
import { PosDeviceService } from '../../service/modules/pos-devices/pos-device.service';
import { PosDeviceController } from '../../controllers/modules/pos-devices/pos-device.controller';
import { AuditLogModule } from './audit-log.module';
import { RealtimeModule } from './realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PosDevice]),
    AuditLogModule,
    RealtimeModule,
  ],
  controllers: [PosDeviceController],
  providers: [PosDeviceRepository, PosDeviceService],
  exports: [PosDeviceService, PosDeviceRepository],
})
export class PosDeviceModule {}
