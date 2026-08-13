export const INVOICE_OVERDUE_JOB = 'invoice.overdue.check';

export const INVOICE_OVERDUE_QUEUE = 'invoice-overdue';

export interface InvoiceOverdueJobPayload {
  invoiceId: string;
  tenantId: string;
  dueDate: string;
  recipientEmail: string;
  ownerName: string;
  businessName: string;
  invoiceNumber: string;
  billingPeriod: string;
  amount: number;
  status: string;
  notes: string | null;
  planType: string;
  outletCount: number;
  ownerPhone: string | null;
  issuedAt: string;
}
