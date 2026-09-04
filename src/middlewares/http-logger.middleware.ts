import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

type AuthenticatedRequest = Request & {
  user?: { id?: string; email?: string; role?: string };
};

function sanitizeLog(value: string): string {
  return value.replace(/[\r\n\t]/g, ' ').substring(0, 500);
}

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const safeUrl = sanitizeLog(originalUrl);
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.socket?.remoteAddress ??
      '-';
    const userAgent = sanitizeLog(req.get('user-agent') || '-');
    const contentLength = req.get('content-length') || '0';
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;
      const userId = req.user?.id ?? 'anonymous';
      const userRole = req.user?.role ?? '-';
      const resContentLength = res.get('content-length') || '-';

      const message =
        `${method} ${safeUrl} | ` +
        `status=${statusCode} | ` +
        `time=${responseTime}ms | ` +
        `user=${userId} role=${userRole} | ` +
        `ip=${ip} | ` +
        `req_size=${contentLength}B res_size=${resContentLength}B | ` +
        `ua=${userAgent}`;

      if (statusCode >= 500) {
        this.logger.error(message);
      } else if (statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}
