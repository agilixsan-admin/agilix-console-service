import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { RealtimeService, SseEvent } from '../../../events/realtime.service';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { UserRole } from '../../../types/enums/user-role.enum';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.SUPPORT_ADMIN,
    UserRole.VIEWER,
  )
  @Sse()
  @HttpCode(HttpStatus.OK)
  stream(): Observable<MessageEvent> {
    return this.realtimeService.getStream().pipe(
      map(
        (event: SseEvent) =>
          ({
            data: JSON.stringify(event),
            type: event.event,
          }) as MessageEvent,
      ),
    );
  }
}
