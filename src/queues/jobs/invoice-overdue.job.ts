export const INVOICE_OVERDUE_JOB = 'invoice.overdue.check';

export const INVOICE_OVERDUE_QUEUE = 'invoice-overdue';

export interface InvoiceOverdueJobPayload {
  invoiceId: string;
  tenantId: string;
  dueDate: string;
}
