import { Injectable } from '@nestjs/common';
import { RealtimeService } from './realtime.service';

@Injectable()
export class EventPublisherService {
  constructor(private readonly realtimeService: RealtimeService) {}

  publishTenantLocked(payload: {
    tenantId: string;
    businessName: string;
    status: string;
    lockedBy: string;
  }): void {
    this.realtimeService.publish({
      event: 'tenant.locked',
      version: 1,
      timestamp: new Date().toISOString(),
      data: payload,
    });
  }

  publishTenantUnlocked(payload: {
    tenantId: string;
    businessName: string;
    status: string;
    unlockedBy: string;
  }): void {
    this.realtimeService.publish({
      event: 'tenant.unlocked',
      version: 1,
      timestamp: new Date().toISOString(),
      data: payload,
    });
  }

  publishInvoiceGenerated(payload: {
    invoiceId: string;
    tenantId: string;
    amount: number;
    billingPeriod: string;
  }): void {
    this.realtimeService.publish({
      event: 'invoice.generated',
      version: 1,
      timestamp: new Date().toISOString(),
      data: payload,
    });
  }

  publishInvoiceOverdue(payload: {
    invoiceId: string;
    tenantId: string;
    dueDate: string;
  }): void {
    this.realtimeService.publish({
      event: 'invoice.overdue',
      version: 1,
      timestamp: new Date().toISOString(),
      data: payload,
    });
  }

  publishPaymentReceived(payload: {
    invoiceId: string;
    tenantId: string;
    amount: number;
    paidAt: string;
  }): void {
    this.realtimeService.publish({
      event: 'payment.received',
      version: 1,
      timestamp: new Date().toISOString(),
      data: payload,
    });
  }
}
