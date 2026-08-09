import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../../../models/tenant.model';
import { TenantRepository } from '../../../repositories/modules/tenant.repository';
import { TenantService } from '../../service/modules/tenants/tenant.service';
import { TenantController } from '../../controllers/modules/tenants/tenant.controller';
import { AuditLogModule } from './audit-log.module';
import { RealtimeModule } from './realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant]),
    AuditLogModule,
    RealtimeModule,
  ],
  controllers: [TenantController],
  providers: [TenantRepository, TenantService],
  exports: [TenantService],
})
export class TenantModule {}
