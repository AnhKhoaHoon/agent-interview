import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ConversationMessage } from '../ai/contracts';
import { ContextBuilderService } from '../ai/context/context-builder.service';
import { InterviewQuestionGateService } from '../ai/gate/interview-question-gate.service';
import { InterviewAnswerPlannerService } from '../ai/planner/interview-answer-planner.service';
import { PromptBuilderService } from '../ai/prompt/prompt-builder.service';
import { InterviewAnswerQualityService } from '../ai/quality/interview-answer-quality.service';
import { LlmProviderFactory } from '../ai/providers/llm-provider.factory';
import { DEVOPS_CATEGORY_KEYWORDS } from '../roles/devops/devops-role.config';
import { InterviewStreamService } from '../stream/interview-stream.service';
import { Interview, InterviewMessage } from './interview.types';

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);
  private readonly interviews = new Map<string, Interview>();
  private readonly contextSnapshots = new Map<string, ConversationMessage[]>();

  constructor(
    private readonly streams: InterviewStreamService,
    private readonly questionGate: InterviewQuestionGateService,
    private readonly contextBuilder: ContextBuilderService,
    private readonly answerPlanner: InterviewAnswerPlannerService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly providers: LlmProviderFactory,
    private readonly quality: InterviewAnswerQualityService
  ) {}

  create(): Omit<Interview, 'messages'> {
    const createdAt = new Date().toISOString();
    const interview: Interview = { id: randomUUID(), role: 'devops', status: 'active', createdAt, messages: [] };
    this.interviews.set(interview.id, interview);
    this.streams.emit(interview.id, { type: 'session.ready', data: { interviewId: interview.id } });
    return this.summary(interview);
  }

  get(id: string): Omit<Interview, 'messages'> {
    return this.summary(this.requireInterview(id));
  }

  listMessages(id: string): InterviewMessage[] {
    return this.requireInterview(id).messages.map((message) => ({ ...message }));
  }

  end(id: string): Omit<Interview, 'messages'> {
    const interview = this.requireInterview(id);
    if (interview.status === 'ended') return this.summary(interview);
    interview.status = 'ended';
    interview.endedAt = new Date().toISOString();
    interview.messages
      .filter((message) => message.role === 'interviewer')
      .forEach((message) => this.contextSnapshots.delete(message.id));
    this.streams.close(id);
    return this.summary(interview);
  }

  submitQuestion(id: string, content: string): { questionId: string; accepted: true } {
    const question = this.recordTranscript(id, content.trim());
    return { questionId: question.id, accepted: true };
  }

  transcriptionStarted(id: string, durationMs: number): void {
    const interview = this.requireInterview(id);
    if (interview.status !== 'active') throw new ConflictException('Interview session is not active');
    this.streams.emit(id, { type: 'question.transcribing', data: { durationMs } });
  }

  recordTranscript(id: string, content: string, metadata: { segmentId?: string; speechEndedAtMs?: number } = {}): InterviewMessage {
    const interview = this.requireInterview(id);
    if (interview.status !== 'active') throw new ConflictException('Interview session is not active');
    const transcript = this.addMessage(interview, 'interviewer', content, 'completed', { speechEndedAtMs: metadata.speechEndedAtMs });
    this.streams.emit(id, {
      type: 'question.transcribed',
      data: {
        messageId: transcript.id,
        questionId: transcript.id,
        text: transcript.content,
        ...(metadata.segmentId ? { segmentId: metadata.segmentId } : {}),
        ...(metadata.speechEndedAtMs ? { speechEndedAtMs: metadata.speechEndedAtMs } : {})
      }
    });
    this.startAnswerGeneration(interview, transcript);
    return { ...transcript };
  }

  retryAnswer(id: string, questionId: string): { questionId: string; answerMessageId: string; accepted: true } {
    const interview = this.requireInterview(id);
    if (interview.status !== 'active') throw new ConflictException('Interview session is not active');
    const question = interview.messages.find((message) => message.id === questionId && message.role === 'interviewer');
    if (!question) throw new NotFoundException('Interviewer question not found');
    const answer = this.answerForQuestion(interview, question.id);
    if (!answer || answer.status !== 'failed') throw new ConflictException('Only a failed answer can be retried');
    const restarted = this.startAnswerGeneration(interview, question);
    return { questionId, answerMessageId: restarted.id, accepted: true };
  }

  private startAnswerGeneration(interview: Interview, question: InterviewMessage): InterviewMessage {
    const existing = this.answerForQuestion(interview, question.id);
    if (existing && existing.status !== 'failed') return existing;
    const answer = existing
      ? Object.assign(existing, { content: '', status: 'streaming' as const })
      : this.addMessage(interview, 'assistant', '', 'streaming', { questionId: question.id });
    void this.generateAnswer(interview, question, answer).catch((error: unknown) => this.handleGenerationFailure(interview, question.id, answer.id, error));
    return answer;
  }

  private async generateAnswer(interview: Interview, question: InterviewMessage, answer: InterviewMessage): Promise<void> {
    const startedAt = Date.now();
    const history = this.contextSnapshots.get(question.id) ?? this.contextBuilder.build(
      interview.messages
        .filter((message) => message.sequenceNo < question.sequenceNo && message.status === 'completed')
        .map(({ role, content }) => ({ role, content }))
    );
    if (!this.contextSnapshots.has(question.id)) this.contextSnapshots.set(question.id, history);
    const assessment = this.questionGate.assess(question.content, history);
    const { classification } = assessment;
    const plan = this.answerPlanner.plan(classification);
    this.logger.log(JSON.stringify({
      event: 'answer.plan',
      interviewId: interview.id,
      questionId: question.id,
      answerMessageId: answer.id,
      questionDecision: assessment.decision,
      isFollowUp: assessment.isFollowUp,
      category: classification.category,
      responseMode: classification.responseMode,
      level: classification.level,
      promptVersion: plan.promptVersion
    }));
    const prompt = this.promptBuilder.build({
      question: assessment.normalizedQuestion,
      classification,
      history,
      plan,
      ...(assessment.isFollowUp && assessment.referenceQuestion
        ? { followUp: { referenceQuestion: assessment.referenceQuestion } }
        : {})
    });
    let firstTokenMs: number | undefined;

    this.streams.emit(interview.id, {
      type: 'answer.started',
      data: { messageId: answer.id, questionId: question.id }
    });
    const provider = this.providers.getConfiguredProvider();

    for await (const token of provider.stream(prompt)) {
      if (firstTokenMs === undefined) {
        firstTokenMs = Date.now() - startedAt;
        this.logger.log(JSON.stringify({
          event: 'llm.first_token',
          interviewId: interview.id,
          questionId: question.id,
          answerMessageId: answer.id,
          provider: provider.name,
          llmFirstTokenMs: firstTokenMs,
          ...(question.speechEndedAtMs ? { speechEndToFirstAnswerMs: Date.now() - question.speechEndedAtMs } : {})
        }));
      }
      answer.content += token;
      this.streams.emit(interview.id, { type: 'answer.token', data: { messageId: answer.id, questionId: question.id, text: token } });
    }

    const validation = this.quality.evaluate(answer.content, classification, plan);
    if (!validation.valid) throw new Error(`Answer validation failed: ${validation.reasons.join('; ')}`);
    answer.status = 'completed';
    const keywords = DEVOPS_CATEGORY_KEYWORDS[classification.category] ?? DEVOPS_CATEGORY_KEYWORDS.general;
    this.streams.emit(interview.id, { type: 'answer.keywords', data: { messageId: answer.id, questionId: question.id, keywords } });
    this.streams.emit(interview.id, {
      type: 'answer.completed',
      data: {
        messageId: answer.id,
        questionId: question.id,
        firstTokenMs: firstTokenMs ?? 0,
        totalMs: Date.now() - startedAt,
        ...(question.speechEndedAtMs ? { speechEndToFirstAnswerMs: Date.now() - question.speechEndedAtMs } : {})
      }
    });
    this.logger.log(JSON.stringify({
      event: 'answer.completed',
      interviewId: interview.id,
      questionId: question.id,
      answerMessageId: answer.id,
      provider: provider.name,
      llmTotalMs: Date.now() - startedAt,
      ...(question.speechEndedAtMs ? { speechEndToFirstAnswerMs: Date.now() - question.speechEndedAtMs } : {})
    }));
  }

  private handleGenerationFailure(interview: Interview, questionId: string, answerMessageId: string, error: unknown): void {
    const answer = interview.messages.find((message) => message.id === answerMessageId && message.questionId === questionId);
    if (answer) answer.status = 'failed';
    const message = error instanceof Error ? error.message : 'AI answer generation failed';
    this.streams.emit(interview.id, {
      type: 'answer.error',
      data: { messageId: answerMessageId, questionId, code: 'LLM_GENERATION_FAILED', message, retryable: true, requestId: randomUUID() }
    });
    this.logger.error(JSON.stringify({ event: 'answer.error', interviewId: interview.id, questionId, answerMessageId, error: message }));
  }

  private answerForQuestion(interview: Interview, questionId: string): InterviewMessage | undefined {
    return interview.messages.find((message) => message.role === 'assistant' && message.questionId === questionId);
  }

  private addMessage(
    interview: Interview,
    role: InterviewMessage['role'],
    content: string,
    status: InterviewMessage['status'],
    metadata: Pick<InterviewMessage, 'questionId' | 'speechEndedAtMs'> = {}
  ): InterviewMessage {
    const message: InterviewMessage = {
      id: randomUUID(),
      interviewId: interview.id,
      role,
      content,
      status,
      sequenceNo: interview.messages.length + 1,
      createdAt: new Date().toISOString(),
      ...metadata
    };
    interview.messages.push(message);
    return message;
  }

  private requireInterview(id: string): Interview {
    const interview = this.interviews.get(id);
    if (!interview) throw new NotFoundException('Interview not found');
    return interview;
  }

  private summary(interview: Interview): Omit<Interview, 'messages'> {
    return {
      id: interview.id,
      role: interview.role,
      status: interview.status,
      createdAt: interview.createdAt,
      ...(interview.endedAt ? { endedAt: interview.endedAt } : {})
    };
  }
}
