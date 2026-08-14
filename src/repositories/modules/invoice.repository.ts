import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../../models/invoice.model';
import { InvoiceStatus } from '../../types/enums/invoice-status.enum';
import { PaginatedResult } from '../../types/response.types';

export interface FindAllInvoicesOptions {
  page: number;
  limit: number;
  tenantId?: string;
  status?: InvoiceStatus;
  billingPeriod?: string;
}

@Injectable()
export class InvoiceRepository {
  constructor(
    @InjectRepository(Invoice)
    private readonly repo: Repository<Invoice>,
  ) {}

  async findById(id: string): Promise<Invoice | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    return this.repo.findOne({ where: { invoiceNumber } });
  }

  async findAll(
    options: FindAllInvoicesOptions,
  ): Promise<PaginatedResult<Invoice>> {
    const page = options.page > 0 ? options.page : 1;
    const limit = Math.min(options.limit > 0 ? options.limit : 10, 100);
    const offset = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('invoice')
      .orderBy('invoice.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (options.tenantId)
      qb.andWhere('invoice.tenantId = :tenantId', {
        tenantId: options.tenantId,
      });
    if (options.status)
      qb.andWhere('invoice.status = :status', { status: options.status });
    if (options.billingPeriod)
      qb.andWhere('invoice.billingPeriod = :billingPeriod', {
        billingPeriod: options.billingPeriod,
      });

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(data: Partial<Invoice>): Promise<Invoice> {
    const invoice = this.repo.create(data);
    return this.repo.save(invoice);
  }

  async update(id: string, data: Partial<Invoice>): Promise<Invoice> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async countByTenantAndStatus(
    tenantId: string,
    status: InvoiceStatus,
  ): Promise<number> {
    return this.repo.count({ where: { tenantId, status } });
  }

  async countByBillingPeriod(billingPeriod: string): Promise<number> {
    return this.repo.count({ where: { billingPeriod } });
  }

  /**
   * Invoice PENDING yang due date-nya jatuh antara hari ini sampai N hari ke depan
   * DAN belum pernah dikirim reminder (reminderSentAt IS NULL).
   */
  async findDueForReminder(daysAhead: number): Promise<Invoice[]> {
    return this.repo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.tenant', 'tenant')
      .where('invoice.status = :status', { status: InvoiceStatus.PENDING })
      .andWhere('DATE(invoice.dueDate) >= DATE(NOW())')
      .andWhere(
        `DATE(invoice.dueDate) <= DATE(NOW() + INTERVAL '${Math.floor(daysAhead)} days')`,
      )
      .andWhere('invoice.reminderSentAt IS NULL')
      .getMany();
  }

  /**
   * Invoice PENDING yang sudah overdue DAN belum pernah dikirim notifikasi overdue.
   */
  async findOverdue(): Promise<Invoice[]> {
    return this.repo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.tenant', 'tenant')
      .where('invoice.status = :status', { status: InvoiceStatus.PENDING })
      .andWhere('DATE(invoice.dueDate) < DATE(NOW())')
      .andWhere('invoice.overdueNotifiedAt IS NULL')
      .getMany();
  }

  /**
   * Invoice PENDING yang sudah overdue, sudah dikirim notifikasi overdue,
   * tapi belum dikirim follow-up H+3 dan sudah 3 hari sejak notifikasi pertama.
   */
  async findOverdueFollowUp(): Promise<Invoice[]> {
    return this.repo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.tenant', 'tenant')
      .where('invoice.status = :status', { status: InvoiceStatus.PENDING })
      .andWhere('DATE(invoice.dueDate) < DATE(NOW())')
      .andWhere('invoice.overdueNotifiedAt IS NOT NULL')
      .andWhere('invoice.overdueFollowUpAt IS NULL')
      .andWhere(`invoice.overdueNotifiedAt <= NOW() - INTERVAL '3 days'`)
      .getMany();
  }

  /**
   * Update flag timestamp pada invoice setelah job di-enqueue.
   */
  async updateFlags(
    id: string,
    flags: Partial<
      Pick<
        Invoice,
        'reminderSentAt' | 'overdueNotifiedAt' | 'overdueFollowUpAt'
      >
    >,
  ): Promise<void> {
    await this.repo.update(id, flags);
  }

  async countOverdue(): Promise<number> {
    return this.repo
      .createQueryBuilder('invoice')
      .where('invoice.status = :status', { status: InvoiceStatus.PENDING })
      .andWhere('invoice.dueDate < NOW()')
      .getCount();
  }

  async getRevenueByPeriod(
    months: number,
  ): Promise<{ period: string; total: number }[]> {
    const safeMonths = Math.min(Math.max(Math.floor(months), 1), 24);

    const rows = await this.repo
      .createQueryBuilder('invoice')
      .select('invoice.billingPeriod', 'period')
      .addSelect('SUM(invoice.amount)', 'total')
      .where('invoice.status = :status', { status: InvoiceStatus.PAID })
      .andWhere(
        `TO_DATE(invoice.billingPeriod, 'YYYY-MM') >= DATE_TRUNC('month', NOW()) - INTERVAL '${safeMonths} months'`,
      )
      .groupBy('invoice.billingPeriod')
      .orderBy('invoice.billingPeriod', 'ASC')
      .getRawMany<{ period: string; total: string }>();

    return rows.map((r) => ({ period: r.period, total: parseFloat(r.total) }));
  }
}
