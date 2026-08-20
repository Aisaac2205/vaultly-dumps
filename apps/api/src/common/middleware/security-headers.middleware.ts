import { RequestHandler } from 'express';
import helmet from 'helmet';

export function createApiSecurityHeadersMiddleware(): RequestHandler {
  return helmet({
    // The API serves JSON and SSE, not executable documents. The SPA's CSP
    // belongs at nginx, where HTML and static assets are actually served.
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' },
  });
}
