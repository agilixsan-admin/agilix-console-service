import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../../../models/audit-log.model';
import { AuditLogRepository } from '../../../repositories/modules/audit-log.repository';
import { AuditLogService } from '../../service/modules/audit-logs/audit-log.service';
import { AuditLogController } from '../../controllers/modules/audit-logs/audit-log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditLogController],
  providers: [AuditLogRepository, AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
