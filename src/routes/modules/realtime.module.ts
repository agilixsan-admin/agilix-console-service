import { Module } from '@nestjs/common';
import { RealtimeService } from '../../events/realtime.service';
import { EventPublisherService } from '../../events/event-publisher.service';
import { RealtimeController } from '../../controllers/modules/realtime/realtime.controller';

@Module({
  controllers: [RealtimeController],
  providers: [RealtimeService, EventPublisherService],
  exports: [RealtimeService, EventPublisherService],
})
export class RealtimeModule {}
