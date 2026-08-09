import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface SseEvent {
  event: string;
  version: number;
  timestamp: string;
  data: Record<string, unknown>;
}

@Injectable()
export class RealtimeService implements OnModuleDestroy {
  private readonly subject = new Subject<SseEvent>();

  getStream() {
    return this.subject.asObservable();
  }

  publish(event: SseEvent): void {
    this.subject.next(event);
  }

  onModuleDestroy(): void {
    this.subject.complete();
  }
}
