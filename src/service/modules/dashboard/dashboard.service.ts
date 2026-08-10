import { Injectable } from '@nestjs/common';
import { TenantRepository } from '../../../repositories/modules/tenant.repository';
import { InvoiceRepository } from '../../../repositories/modules/invoice.repository';
import { PosDeviceRepository } from '../../../repositories/modules/pos-device.repository';
import { TenantStatus } from '../../../types/enums/tenant-status.enum';
import { DeviceStatus } from '../../../types/enums/device-status.enum';

export interface DashboardSummary {
  totalTenants: number;
  activeTenants: number;
  lockedTenants: number;
  overdueInvoices: number;
  onlineDevices: number;
}

export interface TenantGrowthItem {
  month: string;
  count: number;
}

export interface RevenueItem {
  period: string;
  total: number;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly posDeviceRepository: PosDeviceRepository,
  ) {}

  async getSummary(): Promise<DashboardSummary> {
    const [
      activeTenants,
      lockedTenants,
      suspendedTenants,
      expiredTenants,
      overdueInvoices,
      onlineDevices,
    ] = await Promise.all([
      this.tenantRepository.countByStatus(TenantStatus.ACTIVE),
      this.tenantRepository.countByStatus(TenantStatus.LOCKED),
      this.tenantRepository.countByStatus(TenantStatus.SUSPENDED),
      this.tenantRepository.countByStatus(TenantStatus.EXPIRED),
      this.invoiceRepository.countOverdue(),
      this.posDeviceRepository.countByStatus(DeviceStatus.ONLINE),
    ]);

    return {
      totalTenants: activeTenants + lockedTenants + suspendedTenants + expiredTenants,
      activeTenants,
      lockedTenants,
      overdueInvoices,
      onlineDevices,
    };
  }

  async getTenantGrowth(months = 6): Promise<TenantGrowthItem[]> {
    return this.tenantRepository.getMonthlyGrowth(months);
  }

  async getRevenueSummary(months = 6): Promise<RevenueItem[]> {
    return this.invoiceRepository.getRevenueByPeriod(months);
  }
}
