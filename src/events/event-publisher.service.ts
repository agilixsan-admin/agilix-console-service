import { Injectable } from '@nestjs/common';
import { RealtimeService } from './realtime.service';

@Injectable()
export class EventPublisherService {
  constructor(private readonly realtimeService: RealtimeService) {}

  // ---------------------------------------------------------------------------
  // Tenant Events — EVENT_CATALOG.md
  // ---------------------------------------------------------------------------

  publishTenantCreated(payload: {
    tenantId: string;
    businessName: string;
    status: string;
  }): void {
    this.realtimeService.publish({
      event: 'tenant.created',
      version: 1,
      timestamp: new Date().toISOString(),
      data: payload,
    });
  }

  publishTenantUpdated(payload: {
    tenantId: string;
    businessName: string;
  }): void {
    this.realtimeService.publish({
      event: 'tenant.updated',
      version: 1,
      timestamp: new Date().toISOString(),
      data: payload,
    });
  }

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

  // ---------------------------------------------------------------------------
  // Invoice Events — EVENT_CATALOG.md
  // ---------------------------------------------------------------------------

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

  publishInvoiceCancelled(payload: {
    invoiceId: string;
    tenantId: string;
  }): void {
    this.realtimeService.publish({
      event: 'invoice.cancelled',
      version: 1,
      timestamp: new Date().toISOString(),
      data: payload,
    });
  }
}
