import { BadRequestException } from '@nestjs/common';
import { InMemoryInterviewRepository } from '../../test/support/in-memory-interview.repository';
import { CandidateContextService, candidateContextKind, normalizeExtractedText } from './candidate-context.service';

describe('CandidateContextService', () => {
  const interviewId = 'interview-1';
  let service: CandidateContextService;

  beforeEach(async () => {
    const repository = new InMemoryInterviewRepository();
    await repository.createInterview({ id: interviewId, role: 'devops', status: 'active', createdAt: new Date().toISOString(), messages: [] }, 'token-hash');
    service = new CandidateContextService(repository);
  });

  it('stores normalized text from a CV while discarding the raw file representation', async () => {
    const saved = await service.upload(interviewId, 'profile', {
      buffer: Buffer.from('  Phuc Do\r\n\r\nDevOps Engineer\nKubernetes   Terraform  '),
      size: 55,
      mimetype: 'text/plain',
      originalname: 'phuc cv.txt'
    });

    expect(saved).toEqual(expect.objectContaining({ kind: 'profile', sourceFilename: 'phuc_cv.txt', characterCount: expect.any(Number) }));
    await expect(service.list(interviewId)).resolves.toEqual([saved]);
    await expect(service.promptContext(interviewId)).resolves.toEqual({ profile: 'Phuc Do\nDevOps Engineer\nKubernetes Terraform' });
  });

  it('keeps profile and job-description context separate and bounded for prompting', async () => {
    await service.upload(interviewId, 'profile', {
      buffer: Buffer.from('Kubernetes and Terraform'), size: 24, mimetype: 'text/plain', originalname: 'cv.txt'
    });
    await service.upload(interviewId, 'job-description', {
      buffer: Buffer.from('Need AWS, CI/CD, and incident response'), size: 37, mimetype: 'text/plain', originalname: 'jd.txt'
    });

    await expect(service.promptContext(interviewId)).resolves.toEqual({
      profile: 'Kubernetes and Terraform',
      jobDescription: 'Need AWS, CI/CD, and incident response'
    });
  });

  it('removes only the requested context when the user withdraws it', async () => {
    await service.upload(interviewId, 'profile', {
      buffer: Buffer.from('Kubernetes experience'), size: 21, mimetype: 'text/plain', originalname: 'cv.txt'
    });
    await service.upload(interviewId, 'job-description', {
      buffer: Buffer.from('Need incident response'), size: 22, mimetype: 'text/plain', originalname: 'jd.txt'
    });

    await expect(service.remove(interviewId, 'profile')).resolves.toEqual({ removed: true });
    await expect(service.list(interviewId)).resolves.toEqual([
      expect.objectContaining({ kind: 'job_description', sourceFilename: 'jd.txt' })
    ]);
    await expect(service.remove(interviewId, 'profile')).resolves.toEqual({ removed: false });
  });

  it('rejects unsupported, empty, and invalid context input with structured exceptions', async () => {
    await expect(service.upload(interviewId, 'profile', {
      buffer: Buffer.from('word'), size: 4, mimetype: 'application/msword', originalname: 'cv.doc'
    })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.upload(interviewId, 'profile', {
      buffer: Buffer.alloc(0), size: 0, mimetype: 'text/plain', originalname: 'cv.txt'
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(() => candidateContextKind('resume')).toThrow('Context kind must be profile or job-description');
  });

  it('normalizes whitespace and applies the configured character bound', () => {
    expect(normalizeExtractedText(' a\n\n b\0c ', 4)).toBe('a\nbc');
  });
});
