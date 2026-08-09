import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Tenant } from '../../../models/tenant.model';
import {
  FindAllTenantsOptions,
  TenantRepository,
} from '../../../repositories/modules/tenant.repository';
import { PaginatedResult } from '../../../types/response.types';
import { CreateTenantDto } from '../../../dto/tenant/create-tenant.dto';
import { UpdateTenantDto } from '../../../dto/tenant/update-tenant.dto';
import { ListTenantsQueryDto } from '../../../dto/tenant/list-tenants-query.dto';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { EventPublisherService } from '../../../events/event-publisher.service';
import { AuditAction } from '../../../types/enums/audit-action.enum';
import { TenantStatus } from '../../../types/enums/tenant-status.enum';

@Injectable()
export class TenantService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly auditLogService: AuditLogService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async findAll(query: ListTenantsQueryDto): Promise<PaginatedResult<Tenant>> {
    return this.tenantRepository.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
      status: query.status,
      planType: query.planType,
    } as FindAllTenantsOptions);
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with id "${id}" not found`);
    }
    return tenant;
  }

  async create(dto: CreateTenantDto, actorId: string): Promise<Tenant> {
    const expiryDate = new Date(dto.expiryDate);
    if (expiryDate <= new Date()) {
      throw new BadRequestException('expiryDate must be a future date');
    }

    const tenant = await this.tenantRepository.create({
      businessName: dto.businessName,
      ownerName: dto.ownerName,
      ownerEmail: dto.ownerEmail,
      ownerPhone: dto.ownerPhone ?? null,
      planType: dto.planType,
      outletCount: dto.outletCount,
      status: TenantStatus.ACTIVE,
      expiryDate,
      notes: dto.notes ?? null,
      createdBy: actorId,
    });

    await this.auditLogService.log({
      actorId,
      tenantId: tenant.id,
      action: AuditAction.TENANT_CREATED,
      targetType: 'Tenant',
      targetId: tenant.id,
      metadata: { businessName: tenant.businessName, planType: tenant.planType },
    });

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto, actorId: string): Promise<Tenant> {
    await this.findById(id);

    const updateData: Partial<Tenant> = {};
    if (dto.businessName !== undefined) updateData.businessName = dto.businessName;
    if (dto.ownerName !== undefined) updateData.ownerName = dto.ownerName;
    if (dto.ownerEmail !== undefined) updateData.ownerEmail = dto.ownerEmail;
    if (dto.ownerPhone !== undefined) updateData.ownerPhone = dto.ownerPhone;
    if (dto.planType !== undefined) updateData.planType = dto.planType;
    if (dto.outletCount !== undefined) updateData.outletCount = dto.outletCount;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.expiryDate !== undefined) updateData.expiryDate = new Date(dto.expiryDate);

    const updated = await this.tenantRepository.update(id, updateData);

    await this.auditLogService.log({
      actorId,
      tenantId: id,
      action: AuditAction.TENANT_UPDATED,
      targetType: 'Tenant',
      targetId: id,
      metadata: { ...dto },
    });

    return updated;
  }

  async lock(id: string, actorId: string): Promise<Tenant> {
    const tenant = await this.findById(id);

    if (tenant.status === TenantStatus.LOCKED) {
      throw new BadRequestException('Tenant is already locked');
    }

    const updated = await this.tenantRepository.update(id, { status: TenantStatus.LOCKED });

    await this.auditLogService.log({
      actorId,
      tenantId: id,
      action: AuditAction.TENANT_LOCKED,
      targetType: 'Tenant',
      targetId: id,
    });

    this.eventPublisher.publishTenantLocked({
      tenantId: id,
      businessName: tenant.businessName,
      status: TenantStatus.LOCKED,
      lockedBy: actorId,
    });

    return updated;
  }

  async unlock(id: string, actorId: string): Promise<Tenant> {
    const tenant = await this.findById(id);

    if (tenant.status !== TenantStatus.LOCKED) {
      throw new BadRequestException('Tenant is not locked');
    }

    const updated = await this.tenantRepository.update(id, { status: TenantStatus.ACTIVE });

    await this.auditLogService.log({
      actorId,
      tenantId: id,
      action: AuditAction.TENANT_UNLOCKED,
      targetType: 'Tenant',
      targetId: id,
    });

    this.eventPublisher.publishTenantUnlocked({
      tenantId: id,
      businessName: tenant.businessName,
      status: TenantStatus.ACTIVE,
      unlockedBy: actorId,
    });

    return updated;
  }

  async remove(id: string, actorId: string): Promise<void> {
    await this.findById(id);
    await this.tenantRepository.softDelete(id);

    await this.auditLogService.log({
      actorId,
      tenantId: id,
      action: AuditAction.TENANT_DELETED,
      targetType: 'Tenant',
      targetId: id,
    });
  }
}
