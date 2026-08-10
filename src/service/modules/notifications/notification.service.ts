import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification } from '../../../models/notification.model';
import {
  CreateNotificationData,
  NotificationRepository,
} from '../../../repositories/modules/notification.repository';
import { PaginatedResult } from '../../../types/response.types';
import { ListNotificationsQueryDto } from '../../../dto/notification/list-notifications-query.dto';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { EventPublisherService } from '../../../events/event-publisher.service';
import { AuditAction } from '../../../types/enums/audit-action.enum';
import { NotificationStatus } from '../../../types/enums/notification-status.enum';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly auditLogService: AuditLogService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async findAll(
    query: ListNotificationsQueryDto,
  ): Promise<PaginatedResult<Notification>> {
    return this.notificationRepository.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      tenantId: query.tenantId,
      status: query.status,
      type: query.type,
    });
  }

  async findById(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundException(`Notification with id "${id}" not found`);
    }
    return notification;
  }

  async create(data: CreateNotificationData): Promise<Notification> {
    return this.notificationRepository.create(data);
  }

  async markSent(id: string, actorId: string): Promise<Notification> {
    const notification = await this.findById(id);

    const updated = await this.notificationRepository.update(id, {
      status: NotificationStatus.SENT,
      sentAt: new Date(),
      failureReason: null,
    });

    await this.auditLogService.log({
      actorId,
      tenantId: notification.tenantId,
      action: AuditAction.NOTIFICATION_SENT,
      targetType: 'Notification',
      targetId: id,
      metadata: { type: notification.type, recipient: notification.recipient },
    });

    this.eventPublisher.publishNotificationSent({
      notificationId: id,
      channel: 'EMAIL',
    });

    return updated;
  }

  async markFailed(
    id: string,
    failureReason: string,
  ): Promise<Notification> {
    await this.findById(id);

    const updated = await this.notificationRepository.update(id, {
      status: NotificationStatus.FAILED,
      failureReason,
    });

    this.eventPublisher.publishNotificationFailed({
      notificationId: id,
      reason: failureReason,
    });

    return updated;
  }

  async resend(id: string, actorId: string): Promise<Notification> {
    const notification = await this.findById(id);

    const updated = await this.notificationRepository.update(id, {
      status: NotificationStatus.PENDING,
      failureReason: null,
    });

    await this.auditLogService.log({
      actorId,
      tenantId: notification.tenantId,
      action: AuditAction.NOTIFICATION_RESENT,
      targetType: 'Notification',
      targetId: id,
      metadata: { type: notification.type, recipient: notification.recipient },
    });

    return updated;
  }
}
