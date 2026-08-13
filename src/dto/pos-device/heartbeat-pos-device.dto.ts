import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class HeartbeatPosDeviceDto {
  @ApiProperty({
    description: 'Timestamp heartbeat dari device dalam format ISO 8601',
    example: '2026-08-13T09:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  timestamp!: string;
}
