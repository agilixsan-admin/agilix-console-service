import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * RequestContextMiddleware
 *
 * Menambahkan metadata request (ipAddress, userAgent) ke object request
 * agar dapat diakses oleh controller dan service untuk keperluan audit log.
 *
 * ARCHITECTURE_RULES.md § Middleware Rules:
 *   - Middleware digunakan untuk request metadata
 *   - Tidak boleh mengandung business logic atau database transaction
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request & { ipAddress?: string; userAgent?: string }, _res: Response, next: NextFunction): void {
    // Ambil IP dari X-Forwarded-For (proxy/load balancer) atau fallback ke remoteAddress
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded
      ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim())
      : (req.socket?.remoteAddress ?? null);

    req.ipAddress = ip ?? undefined;
    req.userAgent = (req.headers['user-agent'] as string) ?? undefined;

    next();
  }
}
