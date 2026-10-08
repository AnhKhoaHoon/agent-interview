import { Injectable } from '@nestjs/common';
import { Observable, ReplaySubject } from 'rxjs';

export type InterviewEventName =
  | 'session.ready'
  | 'question.transcribing'
  | 'question.transcribed'
  | 'question.cancelled'
  | 'answer.started'
  | 'answer.token'
  | 'answer.keywords'
  | 'answer.completed'
  | 'answer.error'
  | 'session.error';

export interface InterviewStreamEvent {
  type: InterviewEventName;
  data: Record<string, unknown>;
}

@Injectable()
export class InterviewStreamService {
  private readonly streams = new Map<string, ReplaySubject<InterviewStreamEvent>>();
  private readonly subscriberCounts = new Map<string, number>();

  open(interviewId: string): Observable<InterviewStreamEvent> {
    return new Observable<InterviewStreamEvent>((subscriber) => {
      const stream = this.getOrCreate(interviewId);
      this.subscriberCounts.set(interviewId, (this.subscriberCounts.get(interviewId) ?? 0) + 1);
      const subscription = stream.subscribe(subscriber);
      return () => {
        subscription.unsubscribe();
        const remaining = (this.subscriberCounts.get(interviewId) ?? 1) - 1;
        if (remaining > 0) this.subscriberCounts.set(interviewId, remaining);
        else this.subscriberCounts.delete(interviewId);
      };
    });
  }

  emit(interviewId: string, event: InterviewStreamEvent): void {
    this.getOrCreate(interviewId).next(event);
  }

  close(interviewId: string): void {
    const stream = this.streams.get(interviewId);
    stream?.complete();
    this.streams.delete(interviewId);
    this.subscriberCounts.delete(interviewId);
  }

  activeSubscriberCount(interviewId: string): number {
    return this.subscriberCounts.get(interviewId) ?? 0;
  }

  private getOrCreate(interviewId: string): ReplaySubject<InterviewStreamEvent> {
    const existing = this.streams.get(interviewId);
    if (existing) return existing;
    const stream = new ReplaySubject<InterviewStreamEvent>(100);
    this.streams.set(interviewId, stream);
    return stream;
  }
}
