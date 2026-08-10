import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BaseController } from '../../base-controller';
import { NotificationService } from '../../../service/modules/notifications/notification.service';
import { ListNotificationsQueryDto } from '../../../dto/notification/list-notifications-query.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { CurrentUser } from '../../../decorators/current-user.decorator';
import { User } from '../../../models/user.model';
import { UserRole } from '../../../types/enums/user-role.enum';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController extends BaseController {
  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.SUPPORT_ADMIN,
    UserRole.VIEWER,
  )
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: ListNotificationsQueryDto) {
    const result = await this.notificationService.findAll(query);
    return this.paginated(result, 'Notifications retrieved successfully');
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.SUPPORT_ADMIN,
    UserRole.VIEWER,
  )
  @HttpCode(HttpStatus.OK)
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const notification = await this.notificationService.findById(id);
    return this.success(notification, 'Notification retrieved successfully');
  }

  @Post(':id/resend')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async resend(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: User,
  ) {
    const notification = await this.notificationService.resend(id, actor.id);
    return this.success(notification, 'Notification queued for resend');
  }
}
