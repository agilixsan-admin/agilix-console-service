import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Tenant } from '../../../models/tenant.model';
import { TenantRepository } from '../../../repositories/modules/tenant.repository';
import { PaginatedResult } from '../../../types/response.types';
import { CreateTenantDto } from '../../../dto/tenant/create-tenant.dto';
import { UpdateTenantDto } from '../../../dto/tenant/update-tenant.dto';
import { ListTenantsQueryDto } from '../../../dto/tenant/list-tenants-query.dto';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { EventPublisherService } from '../../../events/event-publisher.service';
import { NotificationService } from '../notifications/notification.service';
import { EmailTemplateRepository } from '../../../repositories/modules/email-template.repository';
import { AuditAction } from '../../../types/enums/audit-action.enum';
import { TenantStatus } from '../../../types/enums/tenant-status.enum';
import { NotificationStatus } from '../../../types/enums/notification-status.enum';
import { NotificationType } from '../../../types/enums/notification-type.enum';
import {
  EMAIL_NOTIFICATION_QUEUE,
  EMAIL_NOTIFICATION_JOB,
  EmailNotificationJobPayload,
} from '../../../queues/jobs/email-notification.job';
import { WebhookDispatcherService } from '../webhook-dispatcher.service';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly auditLogService: AuditLogService,
    private readonly eventPublisher: EventPublisherService,
    private readonly notificationService: NotificationService,
    private readonly emailTemplateRepository: EmailTemplateRepository,
    private readonly webhookDispatcher: WebhookDispatcherService,
    @InjectQueue(EMAIL_NOTIFICATION_QUEUE)
    private readonly emailQueue: Queue,
  ) {}

  async findAll(query: ListTenantsQueryDto): Promise<PaginatedResult<Tenant>> {
    return this.tenantRepository.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
      status: query.status,
      planType: query.planType,
    });
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
      erpWebhookUrl: dto.erpWebhookUrl ?? null,
      erpWebhookKey: dto.erpWebhookKey ?? null,
      createdBy: actorId,
    });

    await this.auditLogService.log({
      actorId,
      tenantId: tenant.id,
      action: AuditAction.TENANT_CREATED,
      targetType: 'Tenant',
      targetId: tenant.id,
      metadata: {
        businessName: tenant.businessName,
        planType: tenant.planType,
      },
    });

    this.eventPublisher.publishTenantCreated({
      tenantId: tenant.id,
      businessName: tenant.businessName,
      status: tenant.status,
    });

    void this.webhookDispatcher.dispatch(
      { url: tenant.erpWebhookUrl ?? '', apiKey: tenant.erpWebhookKey ?? '' },
      'tenant.created',
      {
        tenantId: tenant.id,
        businessName: tenant.businessName,
        ownerName: tenant.ownerName,
        ownerEmail: tenant.ownerEmail,
        ownerPhone: tenant.ownerPhone,
        planType: tenant.planType,
        outletCount: tenant.outletCount,
        expiryDate: tenant.expiryDate,
      },
    );

    await this.sendWelcomeEmail(tenant);

    return tenant;
  }

  private async sendWelcomeEmail(tenant: Tenant): Promise<void> {
    try {
      const expiryDate = new Date(tenant.expiryDate).toLocaleDateString(
        'id-ID',
        { day: 'numeric', month: 'long', year: 'numeric' },
      );

      const { subject, html } = await this.emailTemplateRepository.render(
        'welcome',
        {
          ownerName: tenant.ownerName,
          businessName: tenant.businessName,
          planType: tenant.planType,
          outletCount: String(tenant.outletCount),
          expiryDate,
        },
      );

      const notification = await this.notificationService.create({
        tenantId: tenant.id,
        type: NotificationType.WELCOME_EMAIL,
        recipient: tenant.ownerEmail,
        subject,
        content: html,
        status: NotificationStatus.PENDING,
      });

      const payload: EmailNotificationJobPayload = {
        notificationId: notification.id,
        tenantId: tenant.id,
        recipient: tenant.ownerEmail,
        subject,
        content: html,
      };

      await this.emailQueue.add(EMAIL_NOTIFICATION_JOB, payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });

      this.logger.log(
        `Welcome email queued for tenant ${tenant.id} → ${tenant.ownerEmail}`,
      );
    } catch (error) {
      // Jangan gagalkan proses create tenant hanya karena email gagal di-queue.
      // Error di-log untuk observability.
      const reason = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to queue welcome email for tenant ${tenant.id}: ${reason}`,
      );
    }
  }

  async update(
    id: string,
    dto: UpdateTenantDto,
    actorId: string,
  ): Promise<Tenant> {
    await this.findById(id);

    const updateData: Partial<Tenant> = {};
    if (dto.businessName !== undefined)
      updateData.businessName = dto.businessName;
    if (dto.ownerName !== undefined) updateData.ownerName = dto.ownerName;
    if (dto.ownerEmail !== undefined) updateData.ownerEmail = dto.ownerEmail;
    if (dto.ownerPhone !== undefined) updateData.ownerPhone = dto.ownerPhone;
    if (dto.planType !== undefined) updateData.planType = dto.planType;
    if (dto.outletCount !== undefined) updateData.outletCount = dto.outletCount;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.expiryDate !== undefined)
      updateData.expiryDate = new Date(dto.expiryDate);
    if (dto.erpWebhookUrl !== undefined)
      updateData.erpWebhookUrl = dto.erpWebhookUrl;
    if (dto.erpWebhookKey !== undefined)
      updateData.erpWebhookKey = dto.erpWebhookKey;

    const updated = await this.tenantRepository.update(id, updateData);

    await this.auditLogService.log({
      actorId,
      tenantId: id,
      action: AuditAction.TENANT_UPDATED,
      targetType: 'Tenant',
      targetId: id,
      metadata: { ...dto },
    });

    this.eventPublisher.publishTenantUpdated({
      tenantId: id,
      businessName: updated.businessName,
    });

    void this.webhookDispatcher.dispatch(
      { url: updated.erpWebhookUrl ?? '', apiKey: updated.erpWebhookKey ?? '' },
      'tenant.updated',
      {
        tenantId: id,
        businessName: updated.businessName,
        ownerName: updated.ownerName,
        ownerEmail: updated.ownerEmail,
        ownerPhone: updated.ownerPhone,
        planType: updated.planType,
        expiryDate: updated.expiryDate,
      },
    );

    return updated;
  }

  async lock(id: string, actorId: string): Promise<Tenant> {
    const tenant = await this.findById(id);

    if (tenant.status === TenantStatus.LOCKED) {
      throw new BadRequestException('Tenant is already locked');
    }

    const updated = await this.tenantRepository.update(id, {
      status: TenantStatus.LOCKED,
    });

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

    void this.webhookDispatcher.dispatch(
      { url: tenant.erpWebhookUrl ?? '', apiKey: tenant.erpWebhookKey ?? '' },
      'tenant.locked',
      {
        tenantId: id,
        status: TenantStatus.LOCKED,
        lockedBy: actorId,
      },
    );

    return updated;
  }

  async unlock(id: string, actorId: string): Promise<Tenant> {
    const tenant = await this.findById(id);

    if (tenant.status !== TenantStatus.LOCKED) {
      throw new BadRequestException('Tenant is not locked');
    }

    const updated = await this.tenantRepository.update(id, {
      status: TenantStatus.ACTIVE,
    });

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

    void this.webhookDispatcher.dispatch(
      { url: tenant.erpWebhookUrl ?? '', apiKey: tenant.erpWebhookKey ?? '' },
      'tenant.unlocked',
      {
        tenantId: id,
        status: TenantStatus.ACTIVE,
        unlockedBy: actorId,
      },
    );

    return updated;
  }

  async remove(id: string, actorId: string): Promise<void> {
    const tenant = await this.findById(id);
    await this.tenantRepository.softDelete(id);

    await this.auditLogService.log({
      actorId,
      tenantId: id,
      action: AuditAction.TENANT_DELETED,
      targetType: 'Tenant',
      targetId: id,
    });

    void this.webhookDispatcher.dispatch(
      { url: tenant.erpWebhookUrl ?? '', apiKey: tenant.erpWebhookKey ?? '' },
      'tenant.deleted',
      {
        tenantId: id,
        deletedBy: actorId,
      },
    );
  }
}
