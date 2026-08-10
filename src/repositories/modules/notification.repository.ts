import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../models/notification.model';
import { NotificationStatus } from '../../types/enums/notification-status.enum';
import { NotificationType } from '../../types/enums/notification-type.enum';
import { PaginatedResult } from '../../types/response.types';

export interface FindAllNotificationsOptions {
  page: number;
  limit: number;
  tenantId?: string;
  status?: NotificationStatus;
  type?: NotificationType;
}

export interface CreateNotificationData {
  tenantId: string;
  type: NotificationType;
  recipient: string;
  subject: string;
  content: string;
  status: NotificationStatus;
  sentAt?: Date | null;
  failureReason?: string | null;
}

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async findById(id: string): Promise<Notification | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findAll(
    options: FindAllNotificationsOptions,
  ): Promise<PaginatedResult<Notification>> {
    const page = options.page > 0 ? options.page : 1;
    const limit = Math.min(options.limit > 0 ? options.limit : 10, 100);
    const offset = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('notification')
      .orderBy('notification.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (options.tenantId) {
      qb.andWhere('notification.tenantId = :tenantId', {
        tenantId: options.tenantId,
      });
    }
    if (options.status) {
      qb.andWhere('notification.status = :status', { status: options.status });
    }
    if (options.type) {
      qb.andWhere('notification.type = :type', { type: options.type });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(data: CreateNotificationData): Promise<Notification> {
    const notification = this.repo.create(data);
    return this.repo.save(notification);
  }

  async update(
    id: string,
    data: Partial<Notification>,
  ): Promise<Notification> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }
}
