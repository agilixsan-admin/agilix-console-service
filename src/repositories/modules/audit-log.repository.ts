import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../models/audit-log.model';
import { AuditAction } from '../../types/enums/audit-action.enum';
import { PaginatedResult } from '../../types/response.types';

export interface CreateAuditLogData {
  actorId: string;
  tenantId?: string | null;
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface FindAllAuditLogsOptions {
  page: number;
  limit: number;
  actorId?: string;
  tenantId?: string;
  action?: AuditAction;
  dateFrom?: Date;
  dateTo?: Date;
}

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async create(data: CreateAuditLogData): Promise<AuditLog> {
    const log = this.repo.create(data);
    return this.repo.save(log);
  }

  async findById(id: string): Promise<AuditLog | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findAll(
    options: FindAllAuditLogsOptions,
  ): Promise<PaginatedResult<AuditLog>> {
    const page = options.page > 0 ? options.page : 1;
    const limit = Math.min(options.limit > 0 ? options.limit : 10, 100);
    const offset = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (options.actorId) {
      qb.andWhere('log.actorId = :actorId', { actorId: options.actorId });
    }
    if (options.tenantId) {
      qb.andWhere('log.tenantId = :tenantId', { tenantId: options.tenantId });
    }
    if (options.action) {
      qb.andWhere('log.action = :action', { action: options.action });
    }
    if (options.dateFrom) {
      qb.andWhere('log.createdAt >= :dateFrom', { dateFrom: options.dateFrom });
    }
    if (options.dateTo) {
      qb.andWhere('log.createdAt <= :dateTo', { dateTo: options.dateTo });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
