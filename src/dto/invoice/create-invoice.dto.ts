import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { trim, trimStripHtml } from '../../utils/transform.util';

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID('4')
  tenantId: string;

  @ApiProperty({
    description: 'Invoice amount in IDR',
    example: 1500000,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Billing period in YYYY-MM format',
    example: '2026-08',
    pattern: '^\\d{4}-(0[1-9]|1[0-2])$',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'billingPeriod must be in format YYYY-MM',
  })
  @Transform(({ value }) => trim(value))
  billingPeriod: string;

  @ApiProperty({
    description: 'Payment due date',
    example: '2026-08-31',
    format: 'date',
  })
  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Monthly subscription fee',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => trimStripHtml(value))
  notes?: string;
}
