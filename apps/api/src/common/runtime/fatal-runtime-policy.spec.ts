import {
  FatalApplication,
  FatalRuntime,
  FatalRuntimeLogger,
  registerFatalRuntimePolicy,
} from './fatal-runtime-policy';

describe('registerFatalRuntimePolicy', () => {
  it('logs, closes the application, and exits non-zero in that order', async () => {
    const calls: string[] = [];
    let listener: (error: Error) => void = () => undefined;
    const app: FatalApplication = {
      close: async () => {
        calls.push('close');
      },
    };
    const runtime: FatalRuntime = {
      on: (_event, handler) => {
        listener = handler;
      },
      exit: (code) => {
        calls.push(`exit:${code}`);
      },
    };
    const logger: FatalRuntimeLogger = {
      error: jest.fn(),
    };

    registerFatalRuntimePolicy(app, runtime, logger);
    listener(new Error('fatal failure'));
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('fatal failure'),
    );
    expect(calls).toEqual(['close', 'exit:1']);
  });

  it('exits non-zero after a close rejection', async () => {
    const calls: string[] = [];
    let listener: (error: Error) => void = () => undefined;
    const app: FatalApplication = {
      close: async () => Promise.reject(new Error('close failed')),
    };
    const runtime: FatalRuntime = {
      on: (_event, handler) => {
        listener = handler;
      },
      exit: (code) => {
        calls.push(`exit:${code}`);
      },
    };
    const logger: FatalRuntimeLogger = {
      error: jest.fn(),
    };

    registerFatalRuntimePolicy(app, runtime, logger);
    listener(new Error('fatal failure'));
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('close failed'),
    );
    expect(calls).toEqual(['exit:1']);
  });
});
