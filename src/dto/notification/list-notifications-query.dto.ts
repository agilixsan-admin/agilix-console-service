import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationStatus } from '../../types/enums/notification-status.enum';
import { NotificationType } from '../../types/enums/notification-type.enum';

export class ListNotificationsQueryDto {
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
    description: 'Filter by notification status',
    example: NotificationStatus.SENT,
    enum: NotificationStatus,
  })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @ApiPropertyOptional({
    description: 'Filter by notification type',
    example: NotificationType.INVOICE_EMAIL,
    enum: NotificationType,
  })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;
}
