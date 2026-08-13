import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PlanType } from '../../types/enums/plan-type.enum';
import { trim, trimLower, trimStripHtml } from '../../utils/transform.util';

export class UpdateTenantDto {
  @ApiPropertyOptional({
    description: 'Updated business name',
    example: 'PT Maju Jaya Updated',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => trim(value))
  businessName?: string;

  @ApiPropertyOptional({
    description: 'Updated owner name',
    example: 'Budi Santoso Updated',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => trim(value))
  ownerName?: string;

  @ApiPropertyOptional({
    description: 'Updated owner email',
    example: 'admin.new@majujaya.com',
    format: 'email',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }) => trimLower(value))
  ownerEmail?: string;

  @ApiPropertyOptional({
    description: 'Updated owner phone',
    example: '+628123456790',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, {
    message: 'ownerPhone format is invalid',
  })
  @Transform(({ value }) => trim(value))
  ownerPhone?: string;

  @ApiPropertyOptional({
    description: 'Updated plan type',
    example: PlanType.ENTERPRISE,
    enum: PlanType,
  })
  @IsOptional()
  @IsEnum(PlanType)
  planType?: PlanType;

  @ApiPropertyOptional({
    description: 'Updated outlet count',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  outletCount?: number;

  @ApiPropertyOptional({
    description: 'Updated expiry date',
    example: '2027-12-31',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'Updated notes',
    example: 'Enterprise customer with priority support',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => trimStripHtml(value))
  notes?: string;
}
