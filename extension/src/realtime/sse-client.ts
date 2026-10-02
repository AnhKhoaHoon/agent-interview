import type { InterviewEvent, InterviewEventName } from '../types/events';

const eventNames: InterviewEventName[] = [
  'session.ready',
  'question.transcribing',
  'question.transcribed',
  'answer.started',
  'answer.token',
  'answer.keywords',
  'answer.completed',
  'answer.error',
  'session.error'
];

export interface SseHandlers {
  onOpen: () => void;
  onEvent: (event: InterviewEvent) => void;
  onError: () => void;
}

export function connectInterviewEvents(url: string, handlers: SseHandlers): EventSource {
  const source = new EventSource(url);
  source.onopen = handlers.onOpen;
  source.onerror = handlers.onError;
  for (const eventName of eventNames) {
    source.addEventListener(eventName, (message) => {
      try {
        handlers.onEvent({ type: eventName, data: JSON.parse((message as MessageEvent<string>).data) as Record<string, unknown> });
      } catch {
        handlers.onError();
      }
    });
  }
  return source;
}
