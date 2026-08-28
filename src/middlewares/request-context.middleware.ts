import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(
    req: Request & { ipAddress?: string; userAgent?: string },
    _res: Response,
    next: NextFunction,
  ): void {
    // Get IP From X-Forwarded-For (proxy/load balancer) or fallback to remoteAddress
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded
      ? Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded.split(',')[0].trim()
      : (req.socket?.remoteAddress ?? null);

    req.ipAddress = ip ?? undefined;
    req.userAgent = req.headers['user-agent'] ?? undefined;

    next();
  }
}
