import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { LlmGenerationInput, LlmProvider } from '../ai/contracts';
import { LlmProviderFactory } from '../ai/providers/llm-provider.factory';
import { InterviewStreamEvent, InterviewStreamService } from '../stream/interview-stream.service';
import { DeterministicTestLlmProvider } from '../../test/support/deterministic-test-llm.provider';
import { InMemoryInterviewRepository } from '../../test/support/in-memory-interview.repository';
import { DatabaseService } from '../persistence/database.service';
import { InterviewRepository } from '../persistence/interview.repository';
import { InterviewService } from './interview.service';

class FailingTestLlmProvider implements LlmProvider {
  readonly name = 'failing-test-double';

  stream(_input: LlmGenerationInput): AsyncIterable<string> {
    return {
      [Symbol.asyncIterator](): AsyncIterator<string> {
        return { next: async () => Promise.reject(new Error('Injected test provider failure')) };
      }
    };
  }
}

class CancellableTestLlmProvider implements LlmProvider {
  readonly name = 'cancellable-test-double';
  aborted = false;

  async *stream(_input: LlmGenerationInput, options?: { signal?: AbortSignal }): AsyncIterable<string> {
    yield 'A partial answer ';
    await new Promise<void>((resolve) => {
      if (options?.signal?.aborted) return resolve();
      options?.signal?.addEventListener('abort', () => resolve(), { once: true });
    });
    this.aborted = options?.signal?.aborted === true;
    if (!this.aborted) yield 'that should not be emitted.';
  }
}

describe('InterviewService integration', () => {
  let service: InterviewService;
  let streams: InterviewStreamService;
  let providerShouldFail: boolean;
  let providerShouldWaitForCancellation: boolean;
  let cancellableProvider: CancellableTestLlmProvider;

  beforeEach(async () => {
    providerShouldFail = false;
    providerShouldWaitForCancellation = false;
    const successfulProvider = new DeterministicTestLlmProvider();
    const failingProvider = new FailingTestLlmProvider();
    cancellableProvider = new CancellableTestLlmProvider();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(LlmProviderFactory)
      .useValue({ getConfiguredProvider: () => providerShouldFail ? failingProvider : providerShouldWaitForCancellation ? cancellableProvider : successfulProvider })
      .overrideProvider(InterviewRepository)
      .useValue(new InMemoryInterviewRepository())
      .overrideProvider(DatabaseService)
      .useValue({})
      .compile();
    service = module.get(InterviewService);
    streams = module.get(InterviewStreamService);
  });

  it('accepts a text question and emits a completed SSE answer', async () => {
    const interview = await service.create();
    const events: InterviewStreamEvent[] = [];
    const completion = new Promise<void>((resolve, reject) => {
      streams.open(interview.id).subscribe({
        next: (event) => {
          events.push(event);
          if (event.type === 'answer.completed') resolve();
          if (event.type === 'answer.error') reject(new Error(String(event.data.message)));
        }
      });
    });

    const result = await service.submitQuestion(interview.id, 'What is Kubernetes HPA?');
    await completion;

    expect(result.accepted).toBe(true);
    expect(events.map((event) => event.type)).toEqual(expect.arrayContaining(['question.transcribed', 'answer.started', 'answer.token', 'answer.keywords', 'answer.completed']));
    expect(events.filter((event) => event.type === 'answer.token').length).toBeGreaterThan(1);
    expect(await service.listMessages(interview.id)).toHaveLength(2);
  });

  it('releases a disconnected SSE subscription while retaining the active interview session', async () => {
    const interview = await service.create();
    const subscription = streams.open(interview.id).subscribe();
    expect(streams.activeSubscriberCount(interview.id)).toBe(1);
    subscription.unsubscribe();
    expect(streams.activeSubscriberCount(interview.id)).toBe(0);
    expect((await service.get(interview.id)).status).toBe('active');
  });

  it('automatically streams one correlated answer after a final transcript', async () => {
    const interview = await service.create();
    const events: InterviewStreamEvent[] = [];
    const completion = new Promise<void>((resolve, reject) => {
      streams.open(interview.id).subscribe({
        next: (event) => {
          events.push(event);
          if (event.type === 'answer.completed') resolve();
          if (event.type === 'answer.error') reject(new Error(String(event.data.message)));
        }
      });
    });

    await service.transcriptionStarted(interview.id, 1_550);
    const question = await service.recordTranscript(interview.id, 'What is Kubernetes HPA?', { segmentId: 'segment-1', speechEndedAtMs: Date.now() - 40 });
    await completion;

    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'question.transcribing', data: { durationMs: 1_550 } }),
      expect.objectContaining({ type: 'question.transcribed', data: expect.objectContaining({ questionId: question.id, segmentId: 'segment-1' }) }),
      expect.objectContaining({ type: 'answer.started', data: expect.objectContaining({ questionId: question.id }) }),
      expect.objectContaining({ type: 'answer.token', data: expect.objectContaining({ questionId: question.id }) }),
      expect.objectContaining({ type: 'answer.completed', data: expect.objectContaining({ questionId: question.id, speechEndToFirstAnswerMs: expect.any(Number) }) })
    ]));
    expect(await service.listMessages(interview.id)).toEqual([
      expect.objectContaining({ id: question.id, role: 'interviewer', content: 'What is Kubernetes HPA?' }),
      expect.objectContaining({ role: 'assistant', questionId: question.id, status: 'completed' })
    ]);
  });

  it('completes a concise clarification answer for an incomplete transcript', async () => {
    const interview = await service.create();
    const completion = new Promise<void>((resolve, reject) => {
      streams.open(interview.id).subscribe((event) => {
        if (event.type === 'answer.completed') resolve();
        if (event.type === 'answer.error') reject(new Error(String(event.data.message)));
      });
    });

    const question = await service.recordTranscript(interview.id, 'What about?');
    await completion;

    expect(await service.listMessages(interview.id)).toEqual([
      expect.objectContaining({ id: question.id, role: 'interviewer', content: 'What about?' }),
      expect.objectContaining({ role: 'assistant', questionId: question.id, status: 'completed', content: expect.stringMatching(/\?$/) })
    ]);
  });

  it('uses completed conversation context to answer a short follow-up', async () => {
    const interview = await service.create();
    const waitForCompletion = (questionId: string) => new Promise<void>((resolve, reject) => {
      const subscription = streams.open(interview.id).subscribe((event) => {
        if (event.type === 'answer.completed' && event.data.questionId === questionId) {
          subscription.unsubscribe();
          resolve();
        }
        if (event.type === 'answer.error' && event.data.questionId === questionId) {
          subscription.unsubscribe();
          reject(new Error(String(event.data.message)));
        }
      });
    });

    const first = await service.recordTranscript(interview.id, 'What is Kubernetes HPA?');
    await waitForCompletion(first.id);
    const followUp = await service.recordTranscript(interview.id, 'Why?');
    await waitForCompletion(followUp.id);

    expect(await service.listMessages(interview.id)).toEqual([
      expect.objectContaining({ id: first.id, role: 'interviewer' }),
      expect.objectContaining({ role: 'assistant', questionId: first.id, status: 'completed' }),
      expect.objectContaining({ id: followUp.id, role: 'interviewer', content: 'Why?' }),
      expect.objectContaining({ role: 'assistant', questionId: followUp.id, status: 'completed', content: expect.stringContaining('Kubernetes HPA') })
    ]);
  });

  it('keeps two overlapping transcript-answer pairs in stable order', async () => {
    const interview = await service.create();
    const completedAnswers = new Set<string>();
    const questionByAnswerId = new Map<string, string>();
    let mismatchedToken = false;
    const completion = new Promise<void>((resolve) => {
      streams.open(interview.id).subscribe((event) => {
        if (event.type === 'answer.started') {
          questionByAnswerId.set(String(event.data.messageId), String(event.data.questionId));
        }
        if (event.type === 'answer.token') {
          mismatchedToken ||= questionByAnswerId.get(String(event.data.messageId)) !== String(event.data.questionId);
        }
        if (event.type !== 'answer.completed') return;
        completedAnswers.add(String(event.data.questionId));
        if (completedAnswers.size === 2) resolve();
      });
    });

    const first = await service.recordTranscript(interview.id, 'What is Kubernetes HPA?');
    const second = await service.recordTranscript(interview.id, 'What is Terraform state?');
    await completion;

    expect(mismatchedToken).toBe(false);
    expect(questionByAnswerId.size).toBe(2);

    expect((await service.listMessages(interview.id)).map((message) => ({ role: message.role, questionId: message.questionId, id: message.id }))).toEqual([
      { role: 'interviewer', questionId: undefined, id: first.id },
      { role: 'assistant', questionId: first.id, id: expect.any(String) },
      { role: 'interviewer', questionId: undefined, id: second.id },
      { role: 'assistant', questionId: second.id, id: expect.any(String) }
    ]);
  });

  it('preserves the transcript and retries only a failed correlated answer', async () => {
    const interview = await service.create();
    const events: InterviewStreamEvent[] = [];
    const failure = new Promise<void>((resolve) => {
      streams.open(interview.id).subscribe((event) => {
        events.push(event);
        if (event.type === 'answer.error') resolve();
      });
    });

    providerShouldFail = true;
    const question = await service.recordTranscript(interview.id, 'What is Kubernetes HPA?');
    await failure;
    expect(await service.listMessages(interview.id)).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: question.id, role: 'interviewer', content: 'What is Kubernetes HPA?' }),
      expect.objectContaining({ role: 'assistant', questionId: question.id, status: 'failed' })
    ]));

    providerShouldFail = false;
    let retryStarted = false;
    const completion = new Promise<void>((resolve, reject) => {
      streams.open(interview.id).subscribe({
        next: (event) => {
          if (!retryStarted) return;
          if (event.type === 'answer.completed' && event.data.questionId === question.id) resolve();
          if (event.type === 'answer.error') reject(new Error(String(event.data.message)));
        }
      });
    });
    retryStarted = true;
    const retry = await service.retryAnswer(interview.id, question.id);
    await completion;

    expect(retry).toEqual(expect.objectContaining({ questionId: question.id, accepted: true }));
    expect(await service.listMessages(interview.id)).toEqual([
      expect.objectContaining({ id: question.id, role: 'interviewer' }),
      expect.objectContaining({ id: retry.answerMessageId, role: 'assistant', questionId: question.id, status: 'completed' })
    ]);
  });

  it('discards an incorrect transcript and aborts only its correlated answer stream', async () => {
    providerShouldWaitForCancellation = true;
    const interview = await service.create();
    const events: InterviewStreamEvent[] = [];
    const started = new Promise<void>((resolve) => {
      streams.open(interview.id).subscribe((event) => {
        events.push(event);
        if (event.type === 'answer.started') resolve();
      });
    });

    const question = await service.recordTranscript(interview.id, 'Incorrectly recognized question');
    await started;
    await expect(service.cancelQuestion(interview.id, question.id)).resolves.toEqual({
      questionId: question.id, cancelled: true
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(cancellableProvider.aborted).toBe(true);
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'question.cancelled', data: expect.objectContaining({ questionId: question.id }) })
    ]));
    expect(events.filter((event) => event.type === 'answer.completed' || event.type === 'answer.error')).toHaveLength(0);
    await expect(service.listMessages(interview.id)).resolves.toEqual([]);
  });
});
