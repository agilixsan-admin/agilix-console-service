import { IsDateString, IsNotEmpty } from 'class-validator';

export class HeartbeatPosDeviceDto {
  @IsDateString()
  @IsNotEmpty()
  timestamp: string;
}
