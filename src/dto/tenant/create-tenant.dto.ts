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
import { PlanType } from '../../types/enums/plan-type.enum';

export class CreateTenantDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  businessName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  ownerName: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  ownerEmail: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ownerPhone?: string;

  @IsNotEmpty()
  @IsEnum(PlanType)
  planType: PlanType;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  outletCount: number;

  @IsNotEmpty()
  @IsDateString()
  expiryDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
