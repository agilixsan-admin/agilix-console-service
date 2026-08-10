import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { DeviceStatus } from '../../types/enums/device-status.enum';

export class ListPosDevicesQueryDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @IsUUID('4')
  @IsOptional()
  tenantId?: string;

  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;
}
