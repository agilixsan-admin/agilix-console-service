import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class PayInvoiceDto {
  @ApiProperty({
    description: 'Tanggal pembayaran dalam format ISO 8601',
    example: '2026-08-13T09:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  paidAt!: string;
}
