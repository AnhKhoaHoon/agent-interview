import { randomUUID } from 'node:crypto';
import { DatabaseService } from './database.service';
import { PostgresInterviewRepository } from './postgres-interview.repository';

const describeDatabase = process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeDatabase('PostgresInterviewRepository integration', () => {
  let database: DatabaseService;
  let repository: PostgresInterviewRepository;
  let interviewId: string;

  beforeAll(() => {
    database = new DatabaseService();
    repository = new PostgresInterviewRepository(database);
  });

  afterEach(async () => {
    if (interviewId) await database.query('DELETE FROM interviews WHERE id = $1', [interviewId]);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('retains ordered messages, transcript metadata and answer context across repository instances', async () => {
    interviewId = randomUUID();
    const createdAt = new Date().toISOString();
    await repository.createInterview(
      { id: interviewId, role: 'devops', status: 'active', createdAt, messages: [] },
      'a'.repeat(64)
    );
    expect(await repository.hasAccess(interviewId, 'a'.repeat(64))).toBe(true);
    const question = await repository.appendMessage({
      id: randomUUID(), interviewId, role: 'interviewer', content: 'How do you debug a Kubernetes rollout?',
      status: 'completed', createdAt, speechEndedAtMs: Date.now()
    });
    const answer = await repository.appendMessage({
      id: randomUUID(), interviewId, role: 'assistant', content: 'Inspect rollout status and events.',
      status: 'completed', questionId: question.id, createdAt
    });
    const segmentId = randomUUID();
    await repository.saveTranscription({
      id: randomUUID(), interviewId, messageId: question.id, questionId: question.id,
      segmentId, text: question.content, provider: 'integration-test', language: 'en',
      durationMs: 1_200, latencyMs: 75
    });
    const context = [{ role: 'interviewer' as const, content: 'Tell me about deployments.' }];
    await repository.startAiResponse({
      id: randomUUID(), messageId: answer.id, provider: 'integration-test', model: 'test-model',
      promptVersion: 'test-v1', contextSnapshot: context
    });
    await repository.completeAiResponse({ messageId: answer.id, firstTokenMs: 30, totalLatencyMs: 90 });

    const afterRestart = new PostgresInterviewRepository(database);
    const restored = await afterRestart.findInterview(interviewId);
    expect(restored?.messages).toEqual([
      expect.objectContaining({ id: question.id, sequenceNo: 1, role: 'interviewer' }),
      expect.objectContaining({ id: answer.id, sequenceNo: 2, role: 'assistant', questionId: question.id })
    ]);
    expect(await afterRestart.findAnswerContext(answer.id)).toEqual(context);
    expect(await afterRestart.findTranscriptionBySegment(interviewId, segmentId)).toEqual({
      messageId: question.id,
      questionId: question.id,
      text: question.content,
      language: 'en',
      durationMs: 1_200
    });
    const latency = await database.query<{ first_token_ms: number; total_latency_ms: number }>(
      'SELECT first_token_ms, total_latency_ms FROM ai_responses WHERE message_id = $1',
      [answer.id]
    );
    expect(latency.rows[0]).toEqual({ first_token_ms: 30, total_latency_ms: 90 });
  });
});
