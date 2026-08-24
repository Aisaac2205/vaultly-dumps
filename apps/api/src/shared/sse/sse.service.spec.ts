import { firstValueFrom, toArray } from 'rxjs';
import { SseService } from './sse.service';

describe('SseService', () => {
  let service: SseService;

  beforeEach(() => {
    service = new SseService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('subscribe() on a job that was never registered returns an already-closed stream, not a hanging one', async () => {
    const events = await firstValueFrom(service.subscribe('never-registered').pipe(toArray()));

    expect(events).toEqual([]);
  });

  it('delivers events emitted after subscribe() (live progress)', async () => {
    service.register('job-1');
    const received: unknown[] = [];
    service.subscribe('job-1').subscribe((event) => received.push(event));

    service.emit('job-1', { type: 'progress', payload: { percent: 50 } });
    service.complete('job-1');

    expect(received).toEqual([{ type: 'progress', payload: { percent: 50 } }]);
  });

  it('replays buffered events to a subscriber that connects after they were emitted', async () => {
    service.register('job-2');
    service.emit('job-2', { type: 'progress', payload: { percent: 10 } });
    service.emit('job-2', { type: 'progress', payload: { percent: 90 } });
    service.complete('job-2');

    const events = await firstValueFrom(service.subscribe('job-2').pipe(toArray()));

    expect(events).toEqual([
      { type: 'progress', payload: { percent: 10 } },
      { type: 'progress', payload: { percent: 90 } },
    ]);
  });

  it('register() is idempotent — a second call does not replace an in-progress stream', () => {
    service.register('job-3');
    service.emit('job-3', { type: 'progress', payload: { percent: 5 } });

    service.register('job-3');

    const received: unknown[] = [];
    service.subscribe('job-3').subscribe((event) => received.push(event));
    expect(received).toEqual([{ type: 'progress', payload: { percent: 5 } }]);
  });

  it('keeps the stream subscribable during the grace window after complete()', async () => {
    service.register('job-4');
    service.emit('job-4', { type: 'progress', payload: { percent: 100 } });
    service.complete('job-4');

    const events = await firstValueFrom(service.subscribe('job-4').pipe(toArray()));

    expect(events).toEqual([{ type: 'progress', payload: { percent: 100 } }]);
  });

  it('scrubs credentials out of log payloads before they reach a subscriber', () => {
    service.register('job-log');
    const received: unknown[] = [];
    service.subscribe('job-log').subscribe((event) => received.push(event));

    const timestamp = new Date('2026-01-01T00:00:00.000Z');
    service.emit('job-log', {
      type: 'log',
      payload: {
        message: 'connecting with PGPASSWORD=hunter2 to postgres://admin:pw@10.0.0.5:5432/erp',
        timestamp,
      },
    });

    expect(received).toEqual([
      {
        type: 'log',
        payload: { message: 'connecting with PGPASSWORD=*** to [REDACTED]', timestamp },
      },
    ]);
  });

  it('scrubs credentials out of failed payloads before they reach a subscriber', () => {
    service.register('job-failed');
    const received: unknown[] = [];
    service.subscribe('job-failed').subscribe((event) => received.push(event));

    service.emit('job-failed', {
      type: 'failed',
      payload: { jobId: 'job-failed', error: 'pg_restore failed: password=hunter2' },
    });

    expect(received).toEqual([
      {
        type: 'failed',
        payload: { jobId: 'job-failed', error: 'pg_restore failed: password=***' },
      },
    ]);
  });

  it('leaves progress and completed payloads byte-identical', () => {
    service.register('job-untouched');
    const received: unknown[] = [];
    service.subscribe('job-untouched').subscribe((event) => received.push(event));

    const completedAt = new Date('2026-01-01T00:00:00.000Z');
    service.emit('job-untouched', { type: 'progress', payload: { percent: 42 } });
    service.emit('job-untouched', {
      type: 'completed',
      payload: { jobId: 'job-untouched', completedAt },
    });

    expect(received).toEqual([
      { type: 'progress', payload: { percent: 42 } },
      { type: 'completed', payload: { jobId: 'job-untouched', completedAt } },
    ]);
  });

  it('this is the fixed leak: subscribing to a job that finished and aged out never recreates an entry', () => {
    jest.useFakeTimers();

    service.register('job-5');
    service.complete('job-5');

    jest.advanceTimersByTime(60_001);

    const received: unknown[] = [];
    let completed = false;
    service.subscribe('job-5').subscribe({
      next: (event) => received.push(event),
      complete: () => {
        completed = true;
      },
    });

    // Immediately closed (EMPTY), not a fresh subject waiting on a
    // producer that will never call emit()/complete() again.
    expect(received).toEqual([]);
    expect(completed).toBe(true);
  });
});
