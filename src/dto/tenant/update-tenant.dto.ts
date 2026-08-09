import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PlanType } from '../../types/enums/plan-type.enum';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ownerName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  ownerEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ownerPhone?: string;

  @IsOptional()
  @IsEnum(PlanType)
  planType?: PlanType;

  @IsOptional()
  @IsInt()
  @Min(1)
  outletCount?: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
