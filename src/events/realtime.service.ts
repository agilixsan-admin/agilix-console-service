import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface SseEvent {
  event: string;
  version: number;
  timestamp: string;
  data: Record<string, unknown>;
}

@Injectable()
export class RealtimeService implements OnModuleDestroy {
  private readonly logger = new Logger('SSE');
  private readonly subject = new Subject<SseEvent>();
  private subscriberCount = 0;

  getStream(): Observable<SseEvent> {
    this.subscriberCount++;
    this.logger.log(
      `Client connected — active subscribers: ${this.subscriberCount}`,
    );

    return this.subject.asObservable().pipe(
      tap({
        finalize: () => {
          this.subscriberCount--;
          this.logger.log(
            `Client disconnected — active subscribers: ${this.subscriberCount}`,
          );
        },
      }),
    );
  }

  publish(event: SseEvent): void {
    this.logger.log(
      `Publishing event: ${event.event} → ${this.subscriberCount} subscriber(s)`,
    );
    this.subject.next(event);
  }

  onModuleDestroy(): void {
    this.subject.complete();
  }
}
