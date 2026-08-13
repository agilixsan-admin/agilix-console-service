import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceStatus } from '../../types/enums/device-status.enum';
import { trim } from '../../utils/transform.util';

export class UpdatePosDeviceDto {
  @ApiPropertyOptional({
    description: 'Updated device name',
    example: 'Store Branch 2 - Cashier 1',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @Transform(({ value }) => trim(value))
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
