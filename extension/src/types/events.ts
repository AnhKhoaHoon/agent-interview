export type InterviewEventName =
  | 'session.ready'
  | 'question.transcribing'
  | 'question.transcribed'
  | 'answer.started'
  | 'answer.token'
  | 'answer.keywords'
  | 'answer.completed'
  | 'answer.error'
  | 'session.error';

export interface InterviewEvent<T extends Record<string, unknown> = Record<string, unknown>> {
  type: InterviewEventName;
  data: T;
}
