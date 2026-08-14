import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanType } from '../../types/enums/plan-type.enum';
import { trim, trimLower, trimStripHtml } from '../../utils/transform.util';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Business name of the tenant',
    example: 'PT Maju Jaya',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => trim(value))
  businessName: string;

  @ApiProperty({
    description: 'Owner name',
    example: 'Budi Santoso',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => trim(value))
  ownerName: string;

  @ApiProperty({
    description: 'Owner email address',
    example: 'admin@majujaya.com',
    format: 'email',
  })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }) => trimLower(value))
  ownerEmail: string;

  @ApiPropertyOptional({
    description: 'Owner phone number',
    example: '+628123456789',
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

  @ApiProperty({
    description: 'Subscription plan type',
    example: PlanType.MONTHLY,
    enum: PlanType,
  })
  @IsNotEmpty()
  @IsEnum(PlanType)
  planType: PlanType;

  @ApiProperty({
    description: 'Number of outlets',
    example: 5,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  outletCount: number;

  @ApiProperty({
    description: 'Subscription expiry date',
    example: '2026-12-31',
    format: 'date',
  })
  @IsNotEmpty()
  @IsDateString()
  expiryDate: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Premium customer',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => trimStripHtml(value))
  notes?: string;
}
