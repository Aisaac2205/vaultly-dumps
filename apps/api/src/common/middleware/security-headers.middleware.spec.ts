import { AddressInfo } from 'node:net';
import express from 'express';
import { createApiSecurityHeadersMiddleware } from './security-headers.middleware';

describe('createApiSecurityHeadersMiddleware', () => {
  it('sets API security headers without preventing an event stream response', async () => {
    const app = express();
    app.use(createApiSecurityHeadersMiddleware());
    app.get('/api/restores/example/stream', (_request, response) => {
      response.type('text/event-stream').send('event: ready\ndata: {}\n\n');
    });

    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));

    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(
        `http://127.0.0.1:${port}/api/restores/example/stream`,
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/event-stream');
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-frame-options')).toBe('DENY');
      expect(response.headers.get('referrer-policy')).toBe('no-referrer');
      expect(response.headers.get('strict-transport-security')).toContain(
        'max-age=',
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
