import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { configureApp } from './app.config';
import { LlmProviderFactory } from './ai/providers/llm-provider.factory';
import { AppModule } from './app.module';
import { SttProviderFactory } from './transcription/providers/stt-provider.factory';
import { DeterministicTestLlmProvider } from '../test/support/deterministic-test-llm.provider';
import { DeterministicTestSttProvider } from '../test/support/deterministic-test-stt.provider';
import { InMemoryInterviewRepository } from '../test/support/in-memory-interview.repository';
import { DatabaseService } from './persistence/database.service';
import { InterviewRepository } from './persistence/interview.repository';
import { RateLimitService } from './security/rate-limit.service';

describe('HTTP API integration', () => {
  let app: INestApplication;
  const sttProvider = new DeterministicTestSttProvider();

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(LlmProviderFactory)
      .useValue({ getConfiguredProvider: () => new DeterministicTestLlmProvider() })
      .overrideProvider(SttProviderFactory)
      .useValue({ getConfiguredProvider: () => sttProvider })
      .overrideProvider(InterviewRepository)
      .useValue(new InMemoryInterviewRepository())
      .overrideProvider(DatabaseService)
      .useValue({ ping: async () => undefined })
      .overrideProvider(RateLimitService)
      .useValue({ enabled: () => false, ping: async () => 'disabled' })
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves live and ready health endpoints', async () => {
    await request(app.getHttpServer()).get('/api/v1/health/live').expect(200).expect({ status: 'ok' });
    await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200).expect({ status: 'ok', checks: { application: 'ok', database: 'ok', rateLimit: 'disabled' } });
  });

  it('returns the documented structured error for invalid input', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/interviews')
      .send({ role: 'backend' })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({ code: 'REQUEST_INVALID', retryable: false, requestId: expect.any(String) })
    );
    expect(response.body.message).toContain('role must be one of the following values');
  });

  it('creates a DBA session through the documented role selector contract', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/interviews')
      .send({ role: 'dba' })
      .expect(201);

    expect(response.body).toEqual(expect.objectContaining({
      id: expect.any(String), role: 'dba', status: 'active', accessToken: expect.any(String)
    }));
  });

  it('publishes the documented endpoints through Swagger', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    expect(response.body.paths).toEqual(
      expect.objectContaining({
        '/api/v1/health/live': expect.any(Object),
        '/api/v1/interviews': expect.any(Object),
        '/api/v1/interviews/{id}/context': expect.any(Object),
        '/api/v1/interviews/{id}/context/{kind}': expect.any(Object),
        '/api/v1/interviews/{id}/transcriptions': expect.any(Object),
        '/api/v1/interviews/{id}/events': expect.any(Object)
      })
    );
  });

  it('transcribes a finalized audio upload and automatically streams an answer', async () => {
    const interview = await request(app.getHttpServer()).post('/api/v1/interviews').send({ role: 'devops' }).expect(201);
    const transcription = await request(app.getHttpServer())
      .post(`/api/v1/interviews/${interview.body.id}/transcriptions`)
      .set('Authorization', `Bearer ${interview.body.accessToken}`)
      .field('durationMs', '1550')
      .field('segmentId', '3e9ff9fa-0c3e-4d5e-bbf2-7098413f2136')
      .field('speechEndedAtMs', String(Date.now() - 50))
      .field('language', 'vi')
      .attach('audio', Buffer.from('fixture-webm-audio'), { filename: 'utterance.webm', contentType: 'audio/webm' })
      .expect(201);

    expect(transcription.body).toEqual(expect.objectContaining({ text: 'What is Kubernetes HPA?', language: 'en', durationMs: 1550, questionId: transcription.body.messageId }));
    expect(sttProvider.lastOptions).toEqual(expect.objectContaining({ language: 'vi' }));
    const messages = await request(app.getHttpServer())
      .get(`/api/v1/interviews/${interview.body.id}/messages`)
      .set('Authorization', `Bearer ${interview.body.accessToken}`)
      .expect(200);
    expect(messages.body).toEqual([
      expect.objectContaining({ id: transcription.body.questionId, role: 'interviewer', content: 'What is Kubernetes HPA?', status: 'completed' }),
      expect.objectContaining({ role: 'assistant', questionId: transcription.body.questionId, status: 'completed' })
    ]);
  });

  it('accepts a per-interview CV and job description without returning their content', async () => {
    const interview = await request(app.getHttpServer()).post('/api/v1/interviews').send({ role: 'devops' }).expect(201);
    const upload = (kind: string, filename: string, text: string) => request(app.getHttpServer())
      .post(`/api/v1/interviews/${interview.body.id}/context/${kind}`)
      .set('Authorization', `Bearer ${interview.body.accessToken}`)
      .attach('document', Buffer.from(text), { filename, contentType: 'text/plain' });

    const profile = await upload('profile', 'cv.txt', 'Kubernetes and Terraform experience').expect(201);
    expect(profile.body).toEqual(expect.objectContaining({ kind: 'profile', sourceFilename: 'cv.txt' }));
    const jobDescription = await upload('job-description', 'jd.txt', 'Kubernetes and AWS required').expect(201);
    expect(jobDescription.body).toEqual(expect.objectContaining({ kind: 'job_description', sourceFilename: 'jd.txt' }));
    const contexts = await request(app.getHttpServer())
      .get(`/api/v1/interviews/${interview.body.id}/context`)
      .set('Authorization', `Bearer ${interview.body.accessToken}`)
      .expect(200);
    expect(contexts.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'profile', sourceFilename: 'cv.txt', characterCount: expect.any(Number) }),
      expect.objectContaining({ kind: 'job_description', sourceFilename: 'jd.txt', characterCount: expect.any(Number) })
    ]));
    expect(JSON.stringify(contexts.body)).not.toContain('Kubernetes and Terraform experience');
    await request(app.getHttpServer())
      .delete(`/api/v1/interviews/${interview.body.id}/context/profile`)
      .set('Authorization', `Bearer ${interview.body.accessToken}`)
      .expect(200, { removed: true });
    const afterRemoval = await request(app.getHttpServer())
      .get(`/api/v1/interviews/${interview.body.id}/context`)
      .set('Authorization', `Bearer ${interview.body.accessToken}`)
      .expect(200);
    expect(afterRemoval.body).toEqual([expect.objectContaining({ kind: 'job_description' })]);
  });

  it('deduplicates a repeated finalized segment so it cannot invoke the AI twice', async () => {
    const interview = await request(app.getHttpServer()).post('/api/v1/interviews').send({ role: 'devops' }).expect(201);
    const segmentId = '8df34ca2-5933-4fbe-a8d0-39eb8bd17d2d';
    const upload = () => request(app.getHttpServer())
      .post(`/api/v1/interviews/${interview.body.id}/transcriptions`)
      .set('Authorization', `Bearer ${interview.body.accessToken}`)
      .field('durationMs', '1550')
      .field('segmentId', segmentId)
      .field('speechEndedAtMs', String(Date.now() - 50))
      .attach('audio', Buffer.from('fixture-webm-audio'), { filename: 'utterance.webm', contentType: 'audio/webm' });

    const first = await upload().expect(201);
    const duplicate = await upload().expect(201);
    expect(duplicate.body).toEqual(first.body);
    const messages = await request(app.getHttpServer())
      .get(`/api/v1/interviews/${interview.body.id}/messages`)
      .set('Authorization', `Bearer ${interview.body.accessToken}`)
      .expect(200);
    expect(messages.body).toHaveLength(2);
    expect(messages.body[1]).toEqual(expect.objectContaining({ role: 'assistant', questionId: first.body.questionId }));
  });

  it('returns a structured validation error for a missing audio file', async () => {
    const interview = await request(app.getHttpServer()).post('/api/v1/interviews').send({ role: 'devops' }).expect(201);
    const response = await request(app.getHttpServer())
      .post(`/api/v1/interviews/${interview.body.id}/transcriptions`)
      .set('Authorization', `Bearer ${interview.body.accessToken}`)
      .field('durationMs', '1550')
      .expect(400);

    expect(response.body).toEqual(expect.objectContaining({ code: 'AUDIO_FILE_REQUIRED', retryable: false, requestId: expect.any(String) }));
  });

  it('rejects an unsupported audio content type with a structured error', async () => {
    const interview = await request(app.getHttpServer()).post('/api/v1/interviews').send({ role: 'devops' }).expect(201);
    const response = await request(app.getHttpServer())
      .post(`/api/v1/interviews/${interview.body.id}/transcriptions`)
      .set('Authorization', `Bearer ${interview.body.accessToken}`)
      .field('durationMs', '1550')
      .attach('audio', Buffer.from('not-audio'), { filename: 'note.txt', contentType: 'text/plain' })
      .expect(400);

    expect(response.body).toEqual(expect.objectContaining({ code: 'AUDIO_TYPE_UNSUPPORTED', retryable: false, requestId: expect.any(String) }));
  });

  it('rejects an invalid audio duration with the standard structured error', async () => {
    const interview = await request(app.getHttpServer()).post('/api/v1/interviews').send({ role: 'devops' }).expect(201);
    const response = await request(app.getHttpServer())
      .post(`/api/v1/interviews/${interview.body.id}/transcriptions`)
      .set('Authorization', `Bearer ${interview.body.accessToken}`)
      .field('durationMs', '0')
      .attach('audio', Buffer.from('fixture-webm-audio'), { filename: 'utterance.webm', contentType: 'audio/webm' })
      .expect(400);

    expect(response.body).toEqual(expect.objectContaining({ code: 'REQUEST_INVALID', retryable: false, requestId: expect.any(String) }));
  });

  it('rejects an unsupported per-segment transcription language', async () => {
    const interview = await request(app.getHttpServer()).post('/api/v1/interviews').send({ role: 'devops' }).expect(201);
    const response = await request(app.getHttpServer())
      .post(`/api/v1/interviews/${interview.body.id}/transcriptions`)
      .set('Authorization', `Bearer ${interview.body.accessToken}`)
      .field('durationMs', '1550')
      .field('language', 'fr')
      .attach('audio', Buffer.from('fixture-webm-audio'), { filename: 'utterance.webm', contentType: 'audio/webm' })
      .expect(400);

    expect(response.body).toEqual(expect.objectContaining({ code: 'REQUEST_INVALID', retryable: false, requestId: expect.any(String) }));
  });

  it('rejects interview access without the per-session bearer token', async () => {
    const interview = await request(app.getHttpServer()).post('/api/v1/interviews').send({ role: 'devops' }).expect(201);
    expect(interview.body.accessToken).toEqual(expect.any(String));
    const response = await request(app.getHttpServer())
      .get(`/api/v1/interviews/${interview.body.id}/messages`)
      .expect(401);
    expect(response.body).toEqual(expect.objectContaining({ code: 'INTERVIEW_UNAUTHORIZED', retryable: false }));
  });

  it('does not expose metrics without its backend-only scrape credential', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/metrics').expect(401);
    expect(response.body).toEqual(expect.objectContaining({ code: 'METRICS_UNAUTHORIZED', retryable: false }));
  });
});
