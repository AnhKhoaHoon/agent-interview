import { ConversationMessage } from '../ai/contracts';
import { Interview, InterviewMessage } from '../interview/interview.types';

export interface PersistedTranscription {
  messageId: string;
  questionId: string;
  text: string;
  language: string;
  durationMs: number;
}

export interface SaveTranscriptionInput extends PersistedTranscription {
  id: string;
  interviewId: string;
  segmentId?: string;
  provider: string;
  latencyMs: number;
}

export interface StartAiResponseInput {
  id: string;
  messageId: string;
  provider: string;
  model?: string;
  promptVersion: string;
  contextSnapshot: ConversationMessage[];
}

export interface CompleteAiResponseInput {
  messageId: string;
  firstTokenMs: number;
  totalLatencyMs: number;
  speechEndToFirstAnswerMs?: number;
}

export type CandidateContextKind = 'profile' | 'job_description';

export interface CandidateContextRecord {
  kind: CandidateContextKind;
  sourceFilename: string;
  extractedText: string;
  updatedAt: string;
}

export abstract class InterviewRepository {
  abstract createInterview(interview: Interview, accessTokenHash: string): Promise<void>;
  abstract hasAccess(interviewId: string, accessTokenHash: string): Promise<boolean>;
  abstract findInterview(id: string): Promise<Interview | undefined>;
  abstract listMessages(interviewId: string): Promise<InterviewMessage[]>;
  abstract endInterview(interviewId: string, endedAt: string): Promise<void>;
  abstract appendMessage(message: Omit<InterviewMessage, 'sequenceNo'>): Promise<InterviewMessage>;
  abstract updateMessage(message: Pick<InterviewMessage, 'id' | 'content' | 'status'>): Promise<void>;
  abstract findTranscriptionBySegment(interviewId: string, segmentId: string): Promise<PersistedTranscription | undefined>;
  abstract saveTranscription(input: SaveTranscriptionInput): Promise<void>;
  abstract findAnswerContext(messageId: string): Promise<ConversationMessage[] | undefined>;
  abstract startAiResponse(input: StartAiResponseInput): Promise<void>;
  abstract completeAiResponse(input: CompleteAiResponseInput): Promise<void>;
  abstract upsertCandidateContext(interviewId: string, context: Omit<CandidateContextRecord, 'updatedAt'>): Promise<CandidateContextRecord>;
  abstract listCandidateContexts(interviewId: string): Promise<CandidateContextRecord[]>;
  abstract deleteCandidateContext(interviewId: string, kind: CandidateContextKind): Promise<boolean>;
}
