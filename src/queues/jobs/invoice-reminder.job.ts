export const INVOICE_REMINDER_JOB = 'invoice.reminder.send';

export const INVOICE_REMINDER_QUEUE = 'invoice-reminder';

export interface InvoiceReminderJobPayload {
  invoiceId: string;
  tenantId: string;
  recipientEmail: string;
  billingPeriod: string;
  dueDate: string;
  amount: number;
  ownerName: string;
  businessName: string;
  invoiceNumber: string;
  status: string;
  notes: string | null;
  planType: string;
  outletCount: number;
  ownerPhone: string | null;
  issuedAt: string;
}
