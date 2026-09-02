import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RealtimeService } from './realtime.service';

@Injectable()
export class EventPublisherService {
  constructor(private readonly realtimeService: RealtimeService) {}

  publishTenantCreated(payload: {
    tenantId: string;
    businessName: string;
    status: string;
  }): void {
    this.realtimeService.publish({
      event: 'tenant.created',
      eventId: randomUUID(),
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
      eventId: randomUUID(),
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
      eventId: randomUUID(),
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
      eventId: randomUUID(),
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
      eventId: randomUUID(),
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
      eventId: randomUUID(),
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
      eventId: randomUUID(),
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
      eventId: randomUUID(),
      version: 1,
      timestamp: new Date().toISOString(),
      data: payload,
    });
  }

  publishDeviceRegistered(payload: {
    deviceId: string;
    tenantId: string;
  }): void {
    this.realtimeService.publish({
      event: 'device.registered',
      eventId: randomUUID(),
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
      eventId: randomUUID(),
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
      eventId: randomUUID(),
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
      eventId: randomUUID(),
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
      eventId: randomUUID(),
      version: 1,
      timestamp: new Date().toISOString(),
      data: payload,
    });
  }
}
