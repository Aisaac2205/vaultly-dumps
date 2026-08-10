import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { EMPTY, Observable, ReplaySubject } from 'rxjs';

export interface SseEvent {
  type: 'progress' | 'log' | 'completed' | 'failed';
  payload: SseProgressPayload | SseLogPayload | SseCompletedPayload | SseFailedPayload;
}

export interface SseProgressPayload {
  percent: number;
}

export interface SseLogPayload {
  message: string;
  timestamp: Date;
}

export interface SseCompletedPayload {
  jobId: string;
  completedAt: Date;
}

export interface SseFailedPayload {
  jobId: string;
  error: string;
}

const REPLAY_BUFFER_SIZE = 500;

const COMPLETED_GRACE_MS = 60_000;

interface StreamEntry {
  subject: ReplaySubject<SseEvent>;
  cleanupTimer?: ReturnType<typeof setTimeout>;
}

@Injectable()
export class SseService implements OnModuleDestroy {
  private readonly streams = new Map<string, StreamEntry>();

  register(jobId: string): void {
    if (this.streams.has(jobId)) {
      return;
    }
    this.streams.set(jobId, {
      subject: new ReplaySubject<SseEvent>(REPLAY_BUFFER_SIZE),
    });
  }

  subscribe(jobId: string): Observable<SseEvent> {
    return this.streams.get(jobId)?.subject.asObservable() ?? EMPTY;
  }

  emit(jobId: string, event: SseEvent): void {
    this.streams.get(jobId)?.subject.next(event);
  }

  complete(jobId: string): void {
    const entry = this.streams.get(jobId);
    if (!entry) {
      return;
    }
    entry.subject.complete();
    entry.cleanupTimer = setTimeout(() => {
      this.streams.delete(jobId);
    }, COMPLETED_GRACE_MS);
  }

  onModuleDestroy(): void {
    for (const entry of this.streams.values()) {
      if (entry.cleanupTimer) {
        clearTimeout(entry.cleanupTimer);
      }
    }
  }
}
