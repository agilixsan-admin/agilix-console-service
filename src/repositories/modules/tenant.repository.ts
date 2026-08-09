import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../models/tenant.model';
import { TenantStatus } from '../../types/enums/tenant-status.enum';
import { PlanType } from '../../types/enums/plan-type.enum';
import { PaginatedResult } from '../../types/response.types';

export interface FindAllTenantsOptions {
  page: number;
  limit: number;
  search?: string;
  status?: TenantStatus;
  planType?: PlanType;
}

@Injectable()
export class TenantRepository {
  constructor(
    @InjectRepository(Tenant)
    private readonly repo: Repository<Tenant>,
  ) {}

  async findById(id: string): Promise<Tenant | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findAll(options: FindAllTenantsOptions): Promise<PaginatedResult<Tenant>> {
    const page = options.page > 0 ? options.page : 1;
    const limit = Math.min(options.limit > 0 ? options.limit : 10, 100);
    const offset = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('tenant')
      .orderBy('tenant.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (options.search) {
      qb.andWhere(
        '(tenant.businessName ILIKE :search OR tenant.ownerEmail ILIKE :search OR tenant.ownerName ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }
    if (options.status) {
      qb.andWhere('tenant.status = :status', { status: options.status });
    }
    if (options.planType) {
      qb.andWhere('tenant.planType = :planType', { planType: options.planType });
    }

    const [items, total] = await qb.getManyAndCount();

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(data: Partial<Tenant>): Promise<Tenant> {
    const tenant = this.repo.create(data);
    return this.repo.save(tenant);
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
