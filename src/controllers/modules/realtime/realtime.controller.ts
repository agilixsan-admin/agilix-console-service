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

@Controller('events')
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Sse()
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
