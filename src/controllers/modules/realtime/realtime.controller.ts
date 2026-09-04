import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { SkipThrottle } from '@nestjs/throttler';
import { RealtimeService, SseEvent } from '../../../events/realtime.service';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { UserRole } from '../../../types/enums/user-role.enum';

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @ApiOperation({
    summary: 'Subscribe ke Server-Sent Events (SSE) stream realtime',
  })
  @SwaggerResponse({ status: 200, description: 'SSE stream connected' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.SUPPORT_ADMIN,
    UserRole.VIEWER,
  )
  @SkipThrottle()
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
