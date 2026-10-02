import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { InterviewStreamEvent, InterviewStreamService } from '../stream/interview-stream.service';
import { InterviewService } from './interview.service';

describe('InterviewService integration', () => {
  let service: InterviewService;
  let streams: InterviewStreamService;

  beforeEach(async () => {
    process.env.LLM_PROVIDER = 'mock';
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    service = module.get(InterviewService);
    streams = module.get(InterviewStreamService);
  });

  it('accepts a text question and emits a completed SSE answer', async () => {
    const interview = service.create();
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

    const result = service.submitQuestion(interview.id, 'What is Kubernetes HPA?');
    await completion;

    expect(result.accepted).toBe(true);
    expect(events.map((event) => event.type)).toEqual(expect.arrayContaining(['question.transcribed', 'answer.started', 'answer.token', 'answer.keywords', 'answer.completed']));
    expect(events.filter((event) => event.type === 'answer.token').length).toBeGreaterThan(1);
    expect(service.listMessages(interview.id)).toHaveLength(2);
  });

  it('releases a disconnected SSE subscription while retaining the active interview session', () => {
    const interview = service.create();
    const subscription = streams.open(interview.id).subscribe();
    expect(streams.activeSubscriberCount(interview.id)).toBe(1);
    subscription.unsubscribe();
    expect(streams.activeSubscriberCount(interview.id)).toBe(0);
    expect(service.get(interview.id).status).toBe('active');
  });

  it('automatically streams one correlated answer after a final transcript', async () => {
    const interview = service.create();
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

    service.transcriptionStarted(interview.id, 1_550);
    const question = service.recordTranscript(interview.id, 'What is Kubernetes HPA?', { segmentId: 'segment-1', speechEndedAtMs: Date.now() - 40 });
    await completion;

    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'question.transcribing', data: { durationMs: 1_550 } }),
      expect.objectContaining({ type: 'question.transcribed', data: expect.objectContaining({ questionId: question.id, segmentId: 'segment-1' }) }),
      expect.objectContaining({ type: 'answer.started', data: expect.objectContaining({ questionId: question.id }) }),
      expect.objectContaining({ type: 'answer.token', data: expect.objectContaining({ questionId: question.id }) }),
      expect.objectContaining({ type: 'answer.completed', data: expect.objectContaining({ questionId: question.id, speechEndToFirstAnswerMs: expect.any(Number) }) })
    ]));
    expect(service.listMessages(interview.id)).toEqual([
      expect.objectContaining({ id: question.id, role: 'interviewer', content: 'What is Kubernetes HPA?' }),
      expect.objectContaining({ role: 'assistant', questionId: question.id, status: 'completed' })
    ]);
  });

  it('completes a concise clarification answer for an incomplete transcript', async () => {
    const interview = service.create();
    const completion = new Promise<void>((resolve, reject) => {
      streams.open(interview.id).subscribe((event) => {
        if (event.type === 'answer.completed') resolve();
        if (event.type === 'answer.error') reject(new Error(String(event.data.message)));
      });
    });

    const question = service.recordTranscript(interview.id, 'What about?');
    await completion;

    expect(service.listMessages(interview.id)).toEqual([
      expect.objectContaining({ id: question.id, role: 'interviewer', content: 'What about?' }),
      expect.objectContaining({ role: 'assistant', questionId: question.id, status: 'completed', content: expect.stringMatching(/\?$/) })
    ]);
  });

  it('uses completed conversation context to answer a short follow-up', async () => {
    const interview = service.create();
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

    const first = service.recordTranscript(interview.id, 'What is Kubernetes HPA?');
    await waitForCompletion(first.id);
    const followUp = service.recordTranscript(interview.id, 'Why?');
    await waitForCompletion(followUp.id);

    expect(service.listMessages(interview.id)).toEqual([
      expect.objectContaining({ id: first.id, role: 'interviewer' }),
      expect.objectContaining({ role: 'assistant', questionId: first.id, status: 'completed' }),
      expect.objectContaining({ id: followUp.id, role: 'interviewer', content: 'Why?' }),
      expect.objectContaining({ role: 'assistant', questionId: followUp.id, status: 'completed', content: expect.stringContaining('Kubernetes HPA') })
    ]);
  });

  it('keeps two overlapping transcript-answer pairs in stable order', async () => {
    const interview = service.create();
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

    const first = service.recordTranscript(interview.id, 'What is Kubernetes HPA?');
    const second = service.recordTranscript(interview.id, 'What is Terraform state?');
    await completion;

    expect(mismatchedToken).toBe(false);
    expect(questionByAnswerId.size).toBe(2);

    expect(service.listMessages(interview.id).map((message) => ({ role: message.role, questionId: message.questionId, id: message.id }))).toEqual([
      { role: 'interviewer', questionId: undefined, id: first.id },
      { role: 'assistant', questionId: first.id, id: expect.any(String) },
      { role: 'interviewer', questionId: undefined, id: second.id },
      { role: 'assistant', questionId: second.id, id: expect.any(String) }
    ]);
  });

  it('preserves the transcript and retries only a failed correlated answer', async () => {
    const interview = service.create();
    const events: InterviewStreamEvent[] = [];
    const failure = new Promise<void>((resolve) => {
      streams.open(interview.id).subscribe((event) => {
        events.push(event);
        if (event.type === 'answer.error') resolve();
      });
    });

    process.env.LLM_PROVIDER = 'unsupported';
    const question = service.recordTranscript(interview.id, 'What is Kubernetes HPA?');
    await failure;
    expect(service.listMessages(interview.id)).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: question.id, role: 'interviewer', content: 'What is Kubernetes HPA?' }),
      expect.objectContaining({ role: 'assistant', questionId: question.id, status: 'failed' })
    ]));

    process.env.LLM_PROVIDER = 'mock';
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
    const retry = service.retryAnswer(interview.id, question.id);
    await completion;

    expect(retry).toEqual(expect.objectContaining({ questionId: question.id, accepted: true }));
    expect(service.listMessages(interview.id)).toEqual([
      expect.objectContaining({ id: question.id, role: 'interviewer' }),
      expect.objectContaining({ id: retry.answerMessageId, role: 'assistant', questionId: question.id, status: 'completed' })
    ]);
  });
});
