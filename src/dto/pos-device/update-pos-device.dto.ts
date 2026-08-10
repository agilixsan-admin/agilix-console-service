import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceStatus } from '../../types/enums/device-status.enum';

export class UpdatePosDeviceDto {
  @ApiPropertyOptional({
    description: 'Updated device name',
    example: 'Store Branch 2 - Cashier 1',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  deviceName?: string;

  @ApiPropertyOptional({
    description: 'Updated device status',
    example: DeviceStatus.OFFLINE,
    enum: DeviceStatus,
  })
  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;
}
