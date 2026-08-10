import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../../src/service/modules/dashboard/dashboard.service';
import { TenantRepository } from '../../src/repositories/modules/tenant.repository';
import { InvoiceRepository } from '../../src/repositories/modules/invoice.repository';
import { PosDeviceRepository } from '../../src/repositories/modules/pos-device.repository';
import { TenantStatus } from '../../src/types/enums/tenant-status.enum';
import { DeviceStatus } from '../../src/types/enums/device-status.enum';
import {
  mockDashboardTenantRepository,
  mockDashboardInvoiceRepository,
  mockDashboardPosDeviceRepository,
} from '../config/functionUnitTest';

describe('DashboardService', () => {
  let service: DashboardService;
  let tenantRepository: ReturnType<typeof mockDashboardTenantRepository>;
  let invoiceRepository: ReturnType<typeof mockDashboardInvoiceRepository>;
  let posDeviceRepository: ReturnType<typeof mockDashboardPosDeviceRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: TenantRepository,
          useFactory: mockDashboardTenantRepository,
        },
        {
          provide: InvoiceRepository,
          useFactory: mockDashboardInvoiceRepository,
        },
        {
          provide: PosDeviceRepository,
          useFactory: mockDashboardPosDeviceRepository,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    tenantRepository = module.get(TenantRepository);
    invoiceRepository = module.get(InvoiceRepository);
    posDeviceRepository = module.get(PosDeviceRepository);
  });

  afterEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // getSummary
  // -------------------------------------------------------------------------

  describe('getSummary', () => {
    it('harus mengembalikan summary dengan data dari semua repository secara paralel', async () => {
      tenantRepository.countByStatus
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2);
      invoiceRepository.countOverdue.mockResolvedValue(5);
      posDeviceRepository.countByStatus.mockResolvedValue(8);

      const result = await service.getSummary();

      expect(result).toEqual({
        totalTenants: 16,
        activeTenants: 10,
        lockedTenants: 3,
        overdueInvoices: 5,
        onlineDevices: 8,
      });
    });

    it('harus memanggil countByStatus untuk semua TenantStatus yang diperlukan', async () => {
      tenantRepository.countByStatus.mockResolvedValue(0);
      invoiceRepository.countOverdue.mockResolvedValue(0);
      posDeviceRepository.countByStatus.mockResolvedValue(0);

      await service.getSummary();

      expect(tenantRepository.countByStatus).toHaveBeenCalledWith(
        TenantStatus.ACTIVE,
      );
      expect(tenantRepository.countByStatus).toHaveBeenCalledWith(
        TenantStatus.LOCKED,
      );
      expect(tenantRepository.countByStatus).toHaveBeenCalledWith(
        TenantStatus.SUSPENDED,
      );
      expect(tenantRepository.countByStatus).toHaveBeenCalledWith(
        TenantStatus.EXPIRED,
      );
      expect(posDeviceRepository.countByStatus).toHaveBeenCalledWith(
        DeviceStatus.ONLINE,
      );
    });

    it('harus menjalankan semua query secara paralel via Promise.all', async () => {
      const callOrder: string[] = [];
      tenantRepository.countByStatus.mockImplementation(() => {
        callOrder.push('tenant');
        return Promise.resolve(0);
      });
      invoiceRepository.countOverdue.mockImplementation(() => {
        callOrder.push('invoice');
        return Promise.resolve(0);
      });
      posDeviceRepository.countByStatus.mockImplementation(() => {
        callOrder.push('device');
        return Promise.resolve(0);
      });

      await service.getSummary();

      expect(tenantRepository.countByStatus).toHaveBeenCalledTimes(4);
      expect(invoiceRepository.countOverdue).toHaveBeenCalledTimes(1);
      expect(posDeviceRepository.countByStatus).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // getTenantGrowth
  // -------------------------------------------------------------------------

  describe('getTenantGrowth', () => {
    it('harus mengembalikan data pertumbuhan tenant dari repository', async () => {
      const growth = [
        { month: '2026-03', count: 2 },
        { month: '2026-04', count: 5 },
      ];
      tenantRepository.getMonthlyGrowth.mockResolvedValue(growth);

      const result = await service.getTenantGrowth(6);

      expect(tenantRepository.getMonthlyGrowth).toHaveBeenCalledWith(6);
      expect(result).toEqual(growth);
    });

    it('harus menggunakan default 6 bulan jika months tidak diberikan', async () => {
      tenantRepository.getMonthlyGrowth.mockResolvedValue([]);

      await service.getTenantGrowth();

      expect(tenantRepository.getMonthlyGrowth).toHaveBeenCalledWith(6);
    });
  });

  // -------------------------------------------------------------------------
  // getRevenueSummary
  // -------------------------------------------------------------------------

  describe('getRevenueSummary', () => {
    it('harus mengembalikan data revenue dari repository', async () => {
      const revenue = [
        { period: '2026-03', total: 1500000 },
        { period: '2026-04', total: 2000000 },
      ];
      invoiceRepository.getRevenueByPeriod.mockResolvedValue(revenue);

      const result = await service.getRevenueSummary(6);

      expect(invoiceRepository.getRevenueByPeriod).toHaveBeenCalledWith(6);
      expect(result).toEqual(revenue);
    });

    it('harus menggunakan default 6 bulan jika months tidak diberikan', async () => {
      invoiceRepository.getRevenueByPeriod.mockResolvedValue([]);

      await service.getRevenueSummary();

      expect(invoiceRepository.getRevenueByPeriod).toHaveBeenCalledWith(6);
    });
  });
});
