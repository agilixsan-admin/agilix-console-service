import { IsDateString, IsNotEmpty } from 'class-validator';

export class PayInvoiceDto {
  @IsNotEmpty()
  @IsDateString()
  paidAt: string;
}
