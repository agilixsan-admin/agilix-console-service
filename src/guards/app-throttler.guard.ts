import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerOptions } from '@nestjs/throttler';

/**
 * Custom ThrottlerGuard:
 * 1. Skip rate limiting di environment test.
 * 2. Skip endpoint SSE (/events) dan health check (/health).
 * 3. Throttler bernama khusus (misal 'auth', 'strict') hanya dijalankan
 *    pada endpoint yang didekorasi secara eksplisit dengan @Throttle({ auth: ... })
 *    atau @Throttle({ strict: ... }). Jika tidak didekorasi, hanya 'global'/'default'
 *    throttler yang diaplikasikan.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override async shouldSkip(
    context: ExecutionContext,
  ): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      path?: string;
      originalUrl?: string;
      url?: string;
    }>();

    const path = request?.path || request?.originalUrl || request?.url || '';
    if (path.includes('/events') || path.includes('/health')) {
      return true;
    }

    return super.shouldSkip(context);
  }

  protected override async handleRequest(requestProps: {
    context: ExecutionContext;
    limit: number;
    ttl: number;
    throttler: ThrottlerOptions;
    blockDuration: number;
    getTracker: any;
    generateKey: any;
  }): Promise<boolean> {
    const { context, throttler } = requestProps;
    const handler = context.getHandler();
    const classRef = context.getClass();

    // Jika throttler adalah named throttler khusus seperti 'auth' atau 'strict'
    if (
      throttler.name &&
      throttler.name !== 'default' &&
      throttler.name !== 'global'
    ) {
      const specificLimit = this.reflector.getAllAndOverride(
        `THROTTLER:LIMIT${throttler.name}`,
        [handler, classRef],
      );
      // Jika endpoint tidak memiliki dekorator @Throttle khusus untuk throttler ini, skip
      if (specificLimit === undefined) {
        return true;
      }
    }

    return super.handleRequest(requestProps);
  }
}
