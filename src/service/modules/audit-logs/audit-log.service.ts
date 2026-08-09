import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLog } from '../../../models/audit-log.model';
import {
  AuditLogRepository,
  CreateAuditLogData,
} from '../../../repositories/modules/audit-log.repository';
import { PaginatedResult } from '../../../types/response.types';
import { ListAuditLogsQueryDto } from '../../../dto/audit-log/list-audit-logs-query.dto';

@Injectable()
export class AuditLogService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async log(data: CreateAuditLogData): Promise<void> {
    await this.auditLogRepository.create(data);
  }

  async findAll(
    query: ListAuditLogsQueryDto,
  ): Promise<PaginatedResult<AuditLog>> {
    return this.auditLogRepository.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      actorId: query.actorId,
      tenantId: query.tenantId,
      action: query.action,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
  }

  async findById(id: string): Promise<AuditLog> {
    const log = await this.auditLogRepository.findById(id);

    if (!log) {
      throw new NotFoundException(`AuditLog with id "${id}" not found`);
    }

    return log;
  }
}
