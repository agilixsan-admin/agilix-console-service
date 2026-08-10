import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { NotificationStatus } from '../../types/enums/notification-status.enum';
import { NotificationType } from '../../types/enums/notification-type.enum';

export class ListNotificationsQueryDto {
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

  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;
}
