import { Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { RequestLoggerMiddleware } from './request-logger.middleware';

interface FakeRequest {
  method: string;
  path: string;
  ip: string;
  user?: { email: string };
}

describe('RequestLoggerMiddleware', () => {
  let middleware: RequestLoggerMiddleware;
  let finishHandler: () => void;
  let req: FakeRequest;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = new RequestLoggerMiddleware();
    finishHandler = () => undefined;
    req = { method: 'GET', path: '/connections', ip: '10.0.0.1' };
    res = {
      statusCode: 200,
      on: jest.fn((event: string, handler: () => void) => {
        if (event === 'finish') finishHandler = handler;
        return res as Response;
      }),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls next immediately without waiting for the response', () => {
    middleware.use(req as unknown as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('skips logging entirely for /health', () => {
    req.path = '/health';
    const logSpy = jest.spyOn(Logger.prototype, 'log');

    middleware.use(req as unknown as Request, res as Response, next);
    finishHandler();

    expect(res.on).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('logs at "log" level for a successful response, including the authenticated user', () => {
    req.user = { email: 'admin@example.com' };
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    middleware.use(req as unknown as Request, res as Response, next);
    finishHandler();

    expect(logSpy).toHaveBeenCalledTimes(1);
    const [message] = logSpy.mock.calls[0] as [string];
    expect(message).toContain('GET /connections 200');
    expect(message).toContain('admin@example.com');
    expect(message).toContain('10.0.0.1');
  });

  it('falls back to "anonymous" when the request has no authenticated user', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    middleware.use(req as unknown as Request, res as Response, next);
    finishHandler();

    expect(logSpy.mock.calls[0]?.[0]).toContain('anonymous');
  });

  it('logs at "warn" level for a 4xx response', () => {
    res.statusCode = 404;
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    middleware.use(req as unknown as Request, res as Response, next);
    finishHandler();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('logs at "error" level for a 5xx response', () => {
    res.statusCode = 500;
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    middleware.use(req as unknown as Request, res as Response, next);
    finishHandler();

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
