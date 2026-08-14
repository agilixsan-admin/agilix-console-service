import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PosDevice } from '../../../models/pos-device.model';
import { PosDeviceRepository } from '../../../repositories/modules/pos-device.repository';
import { PaginatedResult } from '../../../types/response.types';
import { CreatePosDeviceDto } from '../../../dto/pos-device/create-pos-device.dto';
import { UpdatePosDeviceDto } from '../../../dto/pos-device/update-pos-device.dto';
import { ListPosDevicesQueryDto } from '../../../dto/pos-device/list-pos-devices-query.dto';
import { HeartbeatPosDeviceDto } from '../../../dto/pos-device/heartbeat-pos-device.dto';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { EventPublisherService } from '../../../events/event-publisher.service';
import { AuditAction } from '../../../types/enums/audit-action.enum';
import { DeviceStatus } from '../../../types/enums/device-status.enum';
import { WebhookDispatcherService } from '../webhook-dispatcher.service';

@Injectable()
export class PosDeviceService {
  constructor(
    private readonly posDeviceRepository: PosDeviceRepository,
    private readonly auditLogService: AuditLogService,
    private readonly eventPublisher: EventPublisherService,
    private readonly webhookDispatcher: WebhookDispatcherService,
  ) {}

  async findAll(
    query: ListPosDevicesQueryDto,
  ): Promise<PaginatedResult<PosDevice>> {
    return this.posDeviceRepository.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      tenantId: query.tenantId,
      status: query.status,
    });
  }

  async findById(id: string): Promise<PosDevice> {
    const device = await this.posDeviceRepository.findById(id);
    if (!device) {
      throw new NotFoundException(`PosDevice with id "${id}" not found`);
    }
    return device;
  }

  async create(dto: CreatePosDeviceDto, actorId: string): Promise<PosDevice> {
    const existing = await this.posDeviceRepository.findByDeviceCode(
      dto.deviceCode,
    );
    if (existing) {
      throw new ConflictException(
        `Device with code "${dto.deviceCode}" already exists`,
      );
    }

    const device = await this.posDeviceRepository.create({
      tenantId: dto.tenantId,
      deviceCode: dto.deviceCode,
      deviceName: dto.deviceName,
      status: DeviceStatus.OFFLINE,
      isLocked: false,
      lastSeenAt: null,
    });

    await this.auditLogService.log({
      actorId,
      tenantId: dto.tenantId,
      action: AuditAction.DEVICE_REGISTERED,
      targetType: 'PosDevice',
      targetId: device.id,
      metadata: {
        deviceCode: device.deviceCode,
        deviceName: device.deviceName,
      },
    });

    this.eventPublisher.publishDeviceRegistered({
      deviceId: device.id,
      tenantId: device.tenantId,
    });

    return device;
  }

  async update(
    id: string,
    dto: UpdatePosDeviceDto,
    actorId: string,
  ): Promise<PosDevice> {
    const device = await this.findById(id);

    const updateData: Partial<PosDevice> = {};
    if (dto.deviceName !== undefined) updateData.deviceName = dto.deviceName;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.isLocked !== undefined) updateData.isLocked = dto.isLocked;

    const updated = await this.posDeviceRepository.update(id, updateData);

    await this.auditLogService.log({
      actorId,
      tenantId: device.tenantId,
      action: AuditAction.DEVICE_UPDATED,
      targetType: 'PosDevice',
      targetId: id,
      metadata: { ...dto },
    });

    // Dispatch webhook ke ERP kalau status lock berubah
    if (dto.isLocked === true) {
      void this.webhookDispatcher.dispatch('device.locked', {
        deviceId: id,
        tenantId: device.tenantId,
        deviceCode: device.deviceCode,
        lockedBy: actorId,
      });
    } else if (dto.isLocked === false) {
      void this.webhookDispatcher.dispatch('device.unlocked', {
        deviceId: id,
        tenantId: device.tenantId,
        deviceCode: device.deviceCode,
        unlockedBy: actorId,
      });
    }

    return updated;
  }

  async heartbeat(id: string, dto: HeartbeatPosDeviceDto): Promise<PosDevice> {
    const device = await this.findById(id);

    if (device.isLocked) {
      throw new BadRequestException(
        'Device is locked and cannot send heartbeat',
      );
    }

    const wasOffline = device.status !== DeviceStatus.ONLINE;

    const updated = await this.posDeviceRepository.update(id, {
      lastSeenAt: new Date(dto.timestamp),
      status: DeviceStatus.ONLINE,
    });

    // Publish SSE hanya jika status berubah dari offline ke online
    if (wasOffline) {
      this.eventPublisher.publishDeviceOnline({
        deviceId: device.id,
        tenantId: device.tenantId,
        status: DeviceStatus.ONLINE,
      });
    }

    return updated;
  }

  async remove(id: string, actorId: string): Promise<void> {
    const device = await this.findById(id);

    await this.posDeviceRepository.delete(id);

    await this.auditLogService.log({
      actorId,
      tenantId: device.tenantId,
      action: AuditAction.DEVICE_DELETED,
      targetType: 'PosDevice',
      targetId: id,
    });
  }
}
