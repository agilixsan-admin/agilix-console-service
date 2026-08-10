import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceStatus } from '../../types/enums/device-status.enum';

export class ListPosDevicesQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Records per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter by tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Filter by device status',
    example: DeviceStatus.ONLINE,
    enum: DeviceStatus,
  })
  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;
}
