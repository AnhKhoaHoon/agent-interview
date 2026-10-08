import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { ContextBuilderService } from '../ai/context/context-builder.service';
import { InterviewQuestionGateService } from '../ai/gate/interview-question-gate.service';
import { InterviewAnswerPlannerService } from '../ai/planner/interview-answer-planner.service';
import { PromptBuilderService } from '../ai/prompt/prompt-builder.service';
import { InterviewAnswerQualityService } from '../ai/quality/interview-answer-quality.service';
import { TranscriptNormalizerService } from '../ai/normalizer/transcript-normalizer.service';
import { LlmProviderFactory } from '../ai/providers/llm-provider.factory';
import { InterviewLanguage } from '../ai/contracts';
import { InterviewRepository } from '../persistence/interview.repository';
import { KnowledgeRetrievalService } from '../knowledge/knowledge-retrieval.service';
import { CandidateContextService } from '../candidate-context/candidate-context.service';
import { DEVOPS_CATEGORY_KEYWORDS } from '../roles/devops/devops-role.config';
import { InterviewStreamService } from '../stream/interview-stream.service';
import { Interview, InterviewMessage } from './interview.types';

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);
  private readonly activeGenerations = new Map<string, { interviewId: string; questionId: string; controller: AbortController }>();
  private readonly cancelledQuestionIds = new Set<string>();

  constructor(
    private readonly streams: InterviewStreamService,
    private readonly questionGate: InterviewQuestionGateService,
    private readonly contextBuilder: ContextBuilderService,
    private readonly answerPlanner: InterviewAnswerPlannerService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly providers: LlmProviderFactory,
    private readonly quality: InterviewAnswerQualityService,
    private readonly normalizer: TranscriptNormalizerService,
    private readonly repository: InterviewRepository,
    private readonly knowledge: KnowledgeRetrievalService,
    private readonly candidateContext: CandidateContextService
  ) {}

  async create(): Promise<Omit<Interview, 'messages'> & { accessToken: string }> {
    const createdAt = new Date().toISOString();
    const interview: Interview = { id: randomUUID(), role: 'devops', status: 'active', createdAt, messages: [] };
    const accessToken = randomBytes(32).toString('base64url');
    const accessTokenHash = createHash('sha256').update(accessToken).digest('hex');
    await this.repository.createInterview(interview, accessTokenHash);
    this.streams.emit(interview.id, { type: 'session.ready', data: { interviewId: interview.id } });
    return { ...this.summary(interview), accessToken };
  }

  async get(id: string): Promise<Omit<Interview, 'messages'>> {
    return this.summary(await this.requireInterview(id));
  }

  async listMessages(id: string): Promise<InterviewMessage[]> {
    await this.requireInterview(id);
    return this.repository.listMessages(id);
  }

  async end(id: string): Promise<Omit<Interview, 'messages'>> {
    const interview = await this.requireInterview(id);
    if (interview.status === 'ended') return this.summary(interview);
    interview.status = 'ended';
    interview.endedAt = new Date().toISOString();
    await this.repository.endInterview(id, interview.endedAt);
    this.streams.close(id);
    return this.summary(interview);
  }

  async submitQuestion(id: string, content: string, answerLanguage?: InterviewLanguage): Promise<{ questionId: string; accepted: true }> {
    const question = await this.recordTranscript(id, content.trim(), { answerLanguage });
    return { questionId: question.id, accepted: true };
  }

  async transcriptionStarted(id: string, durationMs: number): Promise<void> {
    const interview = await this.requireInterview(id);
    if (interview.status !== 'active') throw new ConflictException('Interview session is not active');
    this.streams.emit(id, { type: 'question.transcribing', data: { durationMs } });
  }

  async recordTranscript(
    id: string,
    content: string,
    metadata: { segmentId?: string; speechEndedAtMs?: number; answerLanguage?: InterviewLanguage } = {}
  ): Promise<InterviewMessage> {
    const interview = await this.requireInterview(id);
    if (interview.status !== 'active') throw new ConflictException('Interview session is not active');
    const transcript = await this.addMessage(interview, 'interviewer', content, 'completed', {
      speechEndedAtMs: metadata.speechEndedAtMs
    });
    const interpretation = this.normalizer.interpret(transcript.content);
    const question = interpretation.text === transcript.content
      ? transcript
      : { ...transcript, understoodText: interpretation.text };
    this.streams.emit(id, {
      type: 'question.transcribed',
      data: {
        messageId: question.id,
        questionId: question.id,
        text: transcript.content,
        ...(question.understoodText ? { understoodText: question.understoodText } : {}),
        ...(metadata.segmentId ? { segmentId: metadata.segmentId } : {}),
        ...(metadata.speechEndedAtMs ? { speechEndedAtMs: metadata.speechEndedAtMs } : {})
      }
    });
    await this.startAnswerGeneration(await this.requireInterview(id), question, metadata.answerLanguage);
    return question;
  }

  async retryAnswer(
    id: string,
    questionId: string
  ): Promise<{ questionId: string; answerMessageId: string; accepted: true }> {
    const interview = await this.requireInterview(id);
    if (interview.status !== 'active') throw new ConflictException('Interview session is not active');
    const question = interview.messages.find((message) => message.id === questionId && message.role === 'interviewer');
    if (!question) throw new NotFoundException('Interviewer question not found');
    const answer = this.answerForQuestion(interview, question.id);
    if (!answer || answer.status !== 'failed') throw new ConflictException('Only a failed answer can be retried');
    const restarted = await this.startAnswerGeneration(interview, question);
    return { questionId, answerMessageId: restarted.id, accepted: true };
  }

  async cancelQuestion(
    id: string,
    questionId: string
  ): Promise<{ questionId: string; cancelled: true }> {
    const interview = await this.requireInterview(id);
    if (interview.status !== 'active') throw new ConflictException('Interview session is not active');
    const question = interview.messages.find((message) => message.id === questionId && message.role === 'interviewer');
    if (!question) throw new NotFoundException('Interviewer question not found');
    const answer = this.answerForQuestion(interview, question.id);
    this.cancelledQuestionIds.add(questionId);
    if (answer) this.activeGenerations.get(answer.id)?.controller.abort();
    const deleted = await this.repository.deleteQuestion(id, questionId);
    if (!deleted) throw new NotFoundException('Interviewer question not found');
    this.streams.emit(id, {
      type: 'question.cancelled',
      data: { questionId, ...(answer ? { answerMessageId: answer.id } : {}) }
    });
    this.logger.log(JSON.stringify({
      event: 'question.cancelled', interviewId: id, questionId,
      ...(answer ? { answerMessageId: answer.id } : {})
    }));
    return { questionId, cancelled: true };
  }

  private async startAnswerGeneration(
    interview: Interview,
    question: InterviewMessage,
    answerLanguage?: InterviewLanguage
  ): Promise<InterviewMessage> {
    const existing = this.answerForQuestion(interview, question.id);
    if (existing && existing.status !== 'failed') return existing;
    let answer: InterviewMessage;
    if (existing) {
      answer = { ...existing, content: '', status: 'streaming' };
      await this.repository.updateMessage(answer);
    } else {
      answer = await this.addMessage(interview, 'assistant', '', 'streaming', { questionId: question.id });
    }
    const controller = new AbortController();
    this.activeGenerations.set(answer.id, { interviewId: interview.id, questionId: question.id, controller });
    void this.generateAnswer(interview, question, answer, answerLanguage, controller.signal)
      .catch((error: unknown) => {
        if (!this.cancelledQuestionIds.has(question.id)) {
          return this.handleGenerationFailure(interview.id, question.id, answer, error);
        }
      })
      .finally(() => {
        this.activeGenerations.delete(answer.id);
        this.cancelledQuestionIds.delete(question.id);
      });
    return answer;
  }

  private async generateAnswer(
    interview: Interview,
    question: InterviewMessage,
    answer: InterviewMessage,
    answerLanguage?: InterviewLanguage,
    signal?: AbortSignal
  ): Promise<void> {
    this.throwIfQuestionCancelled(question.id);
    const startedAt = Date.now();
    const persistedContext = await this.repository.findAnswerContext(answer.id);
    const history = persistedContext ?? this.contextBuilder.build(
      interview.messages
        .filter((message) => message.sequenceNo < question.sequenceNo && message.status === 'completed')
        .map(({ role, content }) => ({ role, content }))
    );
    const assessment = this.questionGate.assess(question.content, history);
    const { classification } = assessment;
    const plan = this.answerPlanner.plan(classification);
    const knowledge = await this.knowledge.retrieve(assessment.normalizedQuestion, classification.category);
    this.throwIfQuestionCancelled(question.id);
    const candidateContext = await this.candidateContext.promptContext(interview.id);
    const provider = this.providers.getConfiguredProvider();
    await this.repository.startAiResponse({
      id: randomUUID(), messageId: answer.id, provider: provider.name,
      ...(process.env.LLM_MODEL ? { model: process.env.LLM_MODEL } : {}),
      promptVersion: plan.promptVersion, contextSnapshot: history
    });
    this.logger.log(JSON.stringify({
      event: 'answer.plan', interviewId: interview.id, questionId: question.id, answerMessageId: answer.id,
      questionDecision: assessment.decision, isFollowUp: assessment.isFollowUp, category: classification.category,
      responseMode: classification.responseMode, level: classification.level, promptVersion: plan.promptVersion
    }));
    const prompt = this.promptBuilder.build({
      question: assessment.normalizedQuestion, classification, history, plan,
      ...(knowledge ? { knowledge: knowledge.chunks } : {}),
      ...(candidateContext?.profile ? { candidateProfile: candidateContext.profile } : {}),
      ...(candidateContext?.jobDescription ? { jobDescription: candidateContext.jobDescription } : {}),
      ...(answerLanguage ? { answerLanguage } : {}),
      ...(assessment.isFollowUp && assessment.referenceQuestion
        ? { followUp: { referenceQuestion: assessment.referenceQuestion } }
        : {})
    });
    let firstTokenMs: number | undefined;
    let speechEndToFirstAnswerMs: number | undefined;

    this.streams.emit(interview.id, { type: 'answer.started', data: { messageId: answer.id, questionId: question.id } });
    for await (const token of provider.stream(prompt, { signal })) {
      this.throwIfQuestionCancelled(question.id);
      if (firstTokenMs === undefined) {
        firstTokenMs = Date.now() - startedAt;
        speechEndToFirstAnswerMs = question.speechEndedAtMs ? Date.now() - question.speechEndedAtMs : undefined;
        this.logger.log(JSON.stringify({
          event: 'llm.first_token', interviewId: interview.id, questionId: question.id, answerMessageId: answer.id,
          provider: provider.name, llmFirstTokenMs: firstTokenMs,
          ...(speechEndToFirstAnswerMs !== undefined ? { speechEndToFirstAnswerMs } : {})
        }));
      }
      answer.content += token;
      this.streams.emit(interview.id, {
        type: 'answer.token', data: { messageId: answer.id, questionId: question.id, text: token }
      });
    }

    this.throwIfQuestionCancelled(question.id);
    const validation = this.quality.evaluate(answer.content, classification, plan);
    if (validation.warnings?.length) {
      this.logger.warn(JSON.stringify({
        event: 'answer.quality_warning', interviewId: interview.id, questionId: question.id,
        answerMessageId: answer.id, warnings: validation.warnings
      }));
    }
    if (!validation.valid) throw new Error(`Answer validation failed: ${validation.reasons.join('; ')}`);
    answer.status = 'completed';
    const totalMs = Date.now() - startedAt;
    await this.repository.updateMessage(answer);
    await this.repository.completeAiResponse({
      messageId: answer.id, firstTokenMs: firstTokenMs ?? 0, totalLatencyMs: totalMs,
      ...(speechEndToFirstAnswerMs !== undefined ? { speechEndToFirstAnswerMs } : {})
    });
    const keywords = DEVOPS_CATEGORY_KEYWORDS[classification.category] ?? DEVOPS_CATEGORY_KEYWORDS.general;
    this.streams.emit(interview.id, {
      type: 'answer.keywords', data: { messageId: answer.id, questionId: question.id, keywords }
    });
    this.streams.emit(interview.id, {
      type: 'answer.completed',
      data: {
        messageId: answer.id, questionId: question.id, firstTokenMs: firstTokenMs ?? 0, totalMs,
        ...(speechEndToFirstAnswerMs !== undefined ? { speechEndToFirstAnswerMs } : {})
      }
    });
    this.logger.log(JSON.stringify({
      event: 'answer.completed', interviewId: interview.id, questionId: question.id, answerMessageId: answer.id,
      provider: provider.name, llmTotalMs: totalMs,
      ...(speechEndToFirstAnswerMs !== undefined ? { speechEndToFirstAnswerMs } : {})
    }));
  }

  private async handleGenerationFailure(
    interviewId: string,
    questionId: string,
    answer: InterviewMessage,
    error: unknown
  ): Promise<void> {
    answer.status = 'failed';
    await this.repository.updateMessage(answer).catch((persistenceError: unknown) =>
      this.logger.error(JSON.stringify({
        event: 'answer.persistence_failed', interviewId, questionId, answerMessageId: answer.id,
        error: persistenceError instanceof Error ? persistenceError.message : 'Persistence failed'
      }))
    );
    const message = error instanceof Error ? error.message : 'AI answer generation failed';
    this.streams.emit(interviewId, {
      type: 'answer.error',
      data: { messageId: answer.id, questionId, code: 'LLM_GENERATION_FAILED', message, retryable: true, requestId: randomUUID() }
    });
    this.logger.error(JSON.stringify({ event: 'answer.error', interviewId, questionId, answerMessageId: answer.id, error: message }));
  }

  private throwIfQuestionCancelled(questionId: string): void {
    if (this.cancelledQuestionIds.has(questionId)) throw new Error('Question cancelled');
  }

  private answerForQuestion(interview: Interview, questionId: string): InterviewMessage | undefined {
    return interview.messages.find((message) => message.role === 'assistant' && message.questionId === questionId);
  }

  private async addMessage(
    interview: Interview,
    role: InterviewMessage['role'],
    content: string,
    status: InterviewMessage['status'],
    metadata: Pick<InterviewMessage, 'questionId' | 'speechEndedAtMs'> = {}
  ): Promise<InterviewMessage> {
    try {
      return await this.repository.appendMessage({
        id: randomUUID(), interviewId: interview.id, role, content, status,
        createdAt: new Date().toISOString(), ...metadata
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'INTERVIEW_NOT_FOUND') throw new NotFoundException('Interview not found');
      if (error instanceof Error && error.message === 'INTERVIEW_NOT_ACTIVE') throw new ConflictException('Interview session is not active');
      throw error;
    }
  }

  private async requireInterview(id: string): Promise<Interview> {
    const interview = await this.repository.findInterview(id);
    if (!interview) throw new NotFoundException('Interview not found');
    return interview;
  }

  private summary(interview: Interview): Omit<Interview, 'messages'> {
    return {
      id: interview.id, role: interview.role, status: interview.status, createdAt: interview.createdAt,
      ...(interview.endedAt ? { endedAt: interview.endedAt } : {})
    };
  }
}
