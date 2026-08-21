export interface FatalApplication {
  close(): Promise<void>;
}

export interface FatalRuntime {
  on(event: 'uncaughtException', listener: (error: Error) => void): void;
  exit(code: number): void;
}

export interface FatalRuntimeLogger {
  error(message: string): void;
}

export function registerFatalRuntimePolicy(
  app: FatalApplication,
  runtime: FatalRuntime,
  logger: FatalRuntimeLogger,
): void {
  runtime.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}\n${error.stack}`);
    void app
      .close()
      .catch((closeError: Error) => {
        logger.error(`Failed to close after uncaught exception: ${closeError.message}`);
      })
      .finally(() => {
        runtime.exit(1);
      });
  });
}
