import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  INVOICE_OVERDUE_QUEUE,
  InvoiceOverdueJobPayload,
} from '../jobs/invoice-overdue.job';
import { EventPublisherService } from '../../events/event-publisher.service';

@Processor(INVOICE_OVERDUE_QUEUE)
export class InvoiceOverdueProcessor extends WorkerHost {
  private readonly logger = new Logger(InvoiceOverdueProcessor.name);

  constructor(private readonly eventPublisher: EventPublisherService) {
    super();
  }

  async process(job: Job<InvoiceOverdueJobPayload>): Promise<void> {
    const { invoiceId, tenantId, dueDate } = job.data;

    this.logger.log(
      `Processing overdue check for invoice ${invoiceId}`,
    );

    this.eventPublisher.publishInvoiceOverdue({
      invoiceId,
      tenantId,
      dueDate,
    });

    this.logger.log(
      `invoice.overdue event published for invoice ${invoiceId}`,
    );
  }
}
