import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanType } from '../../types/enums/plan-type.enum';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Business name of the tenant',
    example: 'PT Maju Jaya',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  businessName: string;

  @ApiProperty({
    description: 'Owner name',
    example: 'Budi Santoso',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  ownerName: string;

  @ApiProperty({
    description: 'Owner email address',
    example: 'admin@majujaya.com',
    format: 'email',
  })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  ownerEmail: string;

  @ApiPropertyOptional({
    description: 'Owner phone number',
    example: '+628123456789',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  ownerPhone?: string;

  @ApiProperty({
    description: 'Subscription plan type',
    example: PlanType.PRO,
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
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
