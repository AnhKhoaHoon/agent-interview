import { InterviewRole } from '../roles/interview-role';

export type InterviewStatus = 'active' | 'ended';
export type MessageRole = 'interviewer' | 'assistant';
export type MessageStatus = 'completed' | 'streaming' | 'failed';

export interface InterviewMessage {
  id: string;
  interviewId: string;
  role: MessageRole;
  content: string;
  /** Ephemeral AI interpretation of an interviewer transcript; raw content is retained. */
  understoodText?: string;
  status: MessageStatus;
  sequenceNo: number;
  createdAt: string;
  /** Stable correlation to the interviewer message that this assistant answer addresses. */
  questionId?: string;
  /** Client-observed speech-end time, used only for latency measurement. */
  speechEndedAtMs?: number;
}

export interface Interview {
  id: string;
  role: InterviewRole;
  status: InterviewStatus;
  createdAt: string;
  endedAt?: string;
  messages: InterviewMessage[];
}
