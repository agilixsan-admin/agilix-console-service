import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePosDeviceDto {
  @IsUUID('4')
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  deviceCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  deviceName: string;
}
