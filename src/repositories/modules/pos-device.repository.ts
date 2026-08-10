import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PosDevice } from '../../models/pos-device.model';
import { DeviceStatus } from '../../types/enums/device-status.enum';
import { PaginatedResult } from '../../types/response.types';

/**
 * FindAllPosDevicesOptions — query parameters for the device list query.
 */
export interface FindAllPosDevicesOptions {
  page: number;
  limit: number;
  tenantId?: string;
  status?: DeviceStatus;
}

/**
 * PosDeviceRepository
 *
 * Satu-satunya layer yang diizinkan mengakses tabel `pos_devices`.
 *
 * Referensi:
 *   - ARCHITECTURE_RULES.md  → Repository Responsibilities
 *   - DATABASE_RULES.md      → Pagination, Sorting, Index
 *   - DOMAIN_MODEL.md        → Entity: PosDevice
 */
@Injectable()
export class PosDeviceRepository {
  constructor(
    @InjectRepository(PosDevice)
    private readonly repo: Repository<PosDevice>,
  ) {}

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  async findById(id: string): Promise<PosDevice | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByDeviceCode(deviceCode: string): Promise<PosDevice | null> {
    return this.repo.findOne({ where: { deviceCode } });
  }

  async findAll(
    options: FindAllPosDevicesOptions,
  ): Promise<PaginatedResult<PosDevice>> {
    const page = options.page > 0 ? options.page : 1;
    const limit = Math.min(options.limit > 0 ? options.limit : 10, 100);
    const offset = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('device')
      .orderBy('device.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (options.tenantId) {
      qb.andWhere('device.tenantId = :tenantId', {
        tenantId: options.tenantId,
      });
    }

    if (options.status) {
      qb.andWhere('device.status = :status', { status: options.status });
    }

    const [items, total] = await qb.getManyAndCount();

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async countByStatus(status: DeviceStatus): Promise<number> {
    return this.repo.count({ where: { status } });
  }

  // ---------------------------------------------------------------------------
  // Write
  // ---------------------------------------------------------------------------

  async create(data: Partial<PosDevice>): Promise<PosDevice> {
    const device = this.repo.create(data);
    return this.repo.save(device);
  }

  async update(id: string, data: Partial<PosDevice>): Promise<PosDevice> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
