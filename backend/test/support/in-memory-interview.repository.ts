import { ConversationMessage } from '../../src/ai/contracts';
import { Interview, InterviewMessage } from '../../src/interview/interview.types';
import {
  CompleteAiResponseInput,
  CandidateContextRecord,
  InterviewRepository,
  PersistedTranscription,
  SaveTranscriptionInput,
  StartAiResponseInput
} from '../../src/persistence/interview.repository';

export class InMemoryInterviewRepository extends InterviewRepository {
  private readonly interviews = new Map<string, Interview>();
  private readonly transcriptions = new Map<string, PersistedTranscription>();
  private readonly contexts = new Map<string, ConversationMessage[]>();
  private readonly accessTokenHashes = new Map<string, string>();
  private readonly candidateContexts = new Map<string, CandidateContextRecord>();

  async createInterview(interview: Interview, accessTokenHash: string): Promise<void> {
    this.interviews.set(interview.id, this.cloneInterview(interview));
    this.accessTokenHashes.set(interview.id, accessTokenHash);
  }

  async hasAccess(interviewId: string, accessTokenHash: string): Promise<boolean> {
    return this.accessTokenHashes.get(interviewId) === accessTokenHash;
  }

  async findInterview(id: string): Promise<Interview | undefined> {
    const interview = this.interviews.get(id);
    return interview ? this.cloneInterview(interview) : undefined;
  }

  async listMessages(interviewId: string): Promise<InterviewMessage[]> {
    return (this.interviews.get(interviewId)?.messages ?? []).map((message) => ({ ...message }));
  }

  async endInterview(interviewId: string, endedAt: string): Promise<void> {
    const interview = this.interviews.get(interviewId);
    if (interview?.status === 'active') {
      interview.status = 'ended';
      interview.endedAt = endedAt;
    }
  }

  async appendMessage(message: Omit<InterviewMessage, 'sequenceNo'>): Promise<InterviewMessage> {
    const interview = this.interviews.get(message.interviewId);
    if (!interview) throw new Error('INTERVIEW_NOT_FOUND');
    if (interview.status !== 'active') throw new Error('INTERVIEW_NOT_ACTIVE');
    const persisted = { ...message, sequenceNo: interview.messages.length + 1 };
    interview.messages.push(persisted);
    return { ...persisted };
  }

  async updateMessage(message: Pick<InterviewMessage, 'id' | 'content' | 'status'>): Promise<void> {
    for (const interview of this.interviews.values()) {
      const persisted = interview.messages.find((candidate) => candidate.id === message.id);
      if (persisted) Object.assign(persisted, message);
    }
  }

  async findTranscriptionBySegment(interviewId: string, segmentId: string): Promise<PersistedTranscription | undefined> {
    const persisted = this.transcriptions.get(`${interviewId}:${segmentId}`);
    return persisted ? { ...persisted } : undefined;
  }

  async saveTranscription(input: SaveTranscriptionInput): Promise<void> {
    if (!input.segmentId) return;
    this.transcriptions.set(`${input.interviewId}:${input.segmentId}`, {
      messageId: input.messageId,
      questionId: input.questionId,
      text: input.text,
      language: input.language,
      durationMs: input.durationMs
    });
  }

  async findAnswerContext(messageId: string): Promise<ConversationMessage[] | undefined> {
    return this.contexts.get(messageId)?.map((message) => ({ ...message }));
  }

  async startAiResponse(input: StartAiResponseInput): Promise<void> {
    if (!this.contexts.has(input.messageId)) {
      this.contexts.set(input.messageId, input.contextSnapshot.map((message) => ({ ...message })));
    }
  }

  async completeAiResponse(_input: CompleteAiResponseInput): Promise<void> {}

  async upsertCandidateContext(interviewId: string, context: Omit<CandidateContextRecord, 'updatedAt'>): Promise<CandidateContextRecord> {
    const persisted: CandidateContextRecord = { ...context, updatedAt: new Date().toISOString() };
    this.candidateContexts.set(`${interviewId}:${context.kind}`, persisted);
    return { ...persisted };
  }

  async listCandidateContexts(interviewId: string): Promise<CandidateContextRecord[]> {
    return [...this.candidateContexts.entries()]
      .filter(([key]) => key.startsWith(`${interviewId}:`))
      .map(([, context]) => ({ ...context }));
  }

  async deleteCandidateContext(interviewId: string, kind: CandidateContextRecord['kind']): Promise<boolean> {
    return this.candidateContexts.delete(`${interviewId}:${kind}`);
  }

  private cloneInterview(interview: Interview): Interview {
    return { ...interview, messages: interview.messages.map((message) => ({ ...message })) };
  }
}
