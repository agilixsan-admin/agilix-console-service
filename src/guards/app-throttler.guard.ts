import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Custom ThrottlerGuard yang skip rate limiting di environment test.
 *
 * Dibaca dari process.env langsung (bukan ConfigService) agar selalu
 * real-time — tidak terpengaruh oleh kapan ConfigModule diinisialisasi.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override async shouldSkip(
    context: ExecutionContext,
  ): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ path: string }>();
    if (request.path === '/api/v1/health') {
      return true;
    }

    return super.shouldSkip(context);
  }
}
