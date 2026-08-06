import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AuthUser } from '../../auth/decorators/current-user.decorator';

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

// /health is probed every few seconds by Docker/Railway — logging it at
// the same level as real traffic would drown everything else out.
const UNLOGGED_PATHS = new Set(['/health']);

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    if (UNLOGGED_PATHS.has(req.path)) {
      next();
      return;
    }

    const start = Date.now();

    // Registered as global middleware so it runs before guards, but the
    // actual log line is only written on 'finish' — by then the request
    // has already gone through BetterAuthGuard, so req.user is populated
    // for authenticated calls.
    res.on('finish', () => {
      const duration = Date.now() - start;
      const actor = req.user?.email ?? 'anonymous';
      const message = `${req.method} ${req.path} ${res.statusCode} ${duration}ms — ${actor} — ${req.ip}`;

      if (res.statusCode >= 500) {
        this.logger.error(message);
      } else if (res.statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}
