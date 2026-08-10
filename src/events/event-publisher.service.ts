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

  // ---------------------------------------------------------------------------
  // POS Device Events — EVENT_CATALOG.md
  // ---------------------------------------------------------------------------

  publishDeviceRegistered(payload: {
    deviceId: string;
    tenantId: string;
  }): void {
    this.realtimeService.publish({
      event: 'device.registered',
      version: 1,
      timestamp: new Date().toISOString(),
      data: payload,
    });
  }

  publishDeviceOnline(payload: {
    deviceId: string;
    tenantId: string;
    status: string;
  }): void {
    this.realtimeService.publish({
      event: 'device.online',
      version: 1,
      timestamp: new Date().toISOString(),
      data: payload,
    });
  }

  publishDeviceOffline(payload: {
    deviceId: string;
    tenantId: string;
    status: string;
  }): void {
    this.realtimeService.publish({
      event: 'device.offline',
      version: 1,
      timestamp: new Date().toISOString(),
      data: payload,
    });
  }

  publishNotificationSent(payload: {
    notificationId: string;
    channel: string;
  }): void {
    this.realtimeService.publish({
      event: 'notification.sent',
      version: 1,
      timestamp: new Date().toISOString(),
      data: payload,
    });
  }

  publishNotificationFailed(payload: {
    notificationId: string;
    reason: string;
  }): void {
    this.realtimeService.publish({
      event: 'notification.failed',
      version: 1,
      timestamp: new Date().toISOString(),
      data: payload,
    });
  }
}
