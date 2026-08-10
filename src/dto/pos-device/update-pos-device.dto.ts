import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DeviceStatus } from '../../types/enums/device-status.enum';

export class UpdatePosDeviceDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  deviceName?: string;

  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;
}
