import { Injectable } from '@nestjs/common';
import { Observable, ReplaySubject } from 'rxjs';

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

@Injectable()
export class SseService {
  private readonly streams = new Map<string, ReplaySubject<SseEvent>>();

  register(jobId: string): Observable<SseEvent> {
    const existing = this.streams.get(jobId);
    if (existing) {
      return existing.asObservable();
    }

    const subject = new ReplaySubject<SseEvent>();
    this.streams.set(jobId, subject);
    return subject.asObservable();
  }

  emit(jobId: string, event: SseEvent): void {
    const subject = this.streams.get(jobId);
    if (subject) {
      subject.next(event);
    }
  }

  complete(jobId: string): void {
    const subject = this.streams.get(jobId);
    if (subject) {
      subject.complete();
      this.streams.delete(jobId);
    }
  }
}
