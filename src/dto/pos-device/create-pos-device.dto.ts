import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePosDeviceDto {
  @ApiProperty({
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({
    description: 'Unique device code',
    example: 'POS-001',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  deviceCode: string;

  @ApiProperty({
    description: 'Device display name',
    example: 'Store Branch 1 - Cashier 1',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  deviceName: string;
}
