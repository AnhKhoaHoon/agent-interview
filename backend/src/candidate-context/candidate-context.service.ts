import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import { CandidateContextRecord, CandidateContextKind as PersistedCandidateContextKind, InterviewRepository } from '../persistence/interview.repository';
import { candidateContextConfiguration, SUPPORTED_CANDIDATE_DOCUMENT_TYPES } from './candidate-context.config';
import { CandidateContextKind, CandidateContextSummary, CandidatePromptContext, UploadedCandidateDocument } from './candidate-context.types';

@Injectable()
export class CandidateContextService {
  private readonly logger = new Logger(CandidateContextService.name);

  constructor(private readonly repository: InterviewRepository) {}

  async upload(interviewId: string, kind: string, document: UploadedCandidateDocument | undefined): Promise<CandidateContextSummary> {
    const parsedKind = candidateContextKind(kind);
    await this.requireInterview(interviewId);
    this.validateDocument(document);
    const extractedText = await this.extractText(document);
    const normalizedText = normalizeExtractedText(extractedText, candidateContextConfiguration().maxCharacters);
    if (!normalizedText) {
      throw new BadRequestException({
        code: 'CANDIDATE_DOCUMENT_UNREADABLE',
        message: 'The document contains no readable text. Upload a text-based PDF, TXT, or Markdown file.',
        retryable: false
      });
    }
    const persisted = await this.repository.upsertCandidateContext(interviewId, {
      kind: parsedKind as PersistedCandidateContextKind,
      sourceFilename: safeFilename(document.originalname),
      extractedText: normalizedText
    });
    this.logger.log(JSON.stringify({
      event: 'candidate_context.updated', interviewId, kind: parsedKind,
      characterCount: persisted.extractedText.length
    }));
    return summary(persisted);
  }

  async list(interviewId: string): Promise<CandidateContextSummary[]> {
    await this.requireInterview(interviewId);
    return (await this.repository.listCandidateContexts(interviewId)).map(summary);
  }

  async remove(interviewId: string, kind: string): Promise<{ removed: boolean }> {
    const parsedKind = candidateContextKind(kind);
    await this.requireInterview(interviewId);
    const removed = await this.repository.deleteCandidateContext(interviewId, parsedKind as PersistedCandidateContextKind);
    this.logger.log(JSON.stringify({ event: 'candidate_context.removed', interviewId, kind: parsedKind, removed }));
    return { removed };
  }

  async promptContext(interviewId: string): Promise<CandidatePromptContext | undefined> {
    const contexts = await this.repository.listCandidateContexts(interviewId);
    const max = candidateContextConfiguration().promptMaxCharacters;
    const profile = contexts.find((context) => context.kind === 'profile')?.extractedText;
    const jobDescription = contexts.find((context) => context.kind === 'job_description')?.extractedText;
    if (!profile && !jobDescription) return undefined;
    return {
      ...(profile ? { profile: boundedText(profile, max) } : {}),
      ...(jobDescription ? { jobDescription: boundedText(jobDescription, max) } : {})
    };
  }

  private async requireInterview(interviewId: string): Promise<void> {
    if (!await this.repository.findInterview(interviewId)) throw new NotFoundException('Interview not found');
  }

  private validateDocument(document: UploadedCandidateDocument | undefined): asserts document is UploadedCandidateDocument {
    if (!document) throw new BadRequestException({ code: 'CANDIDATE_DOCUMENT_REQUIRED', message: 'A CV or job-description document is required', retryable: false });
    const { maxBytes } = candidateContextConfiguration();
    if (document.size <= 0 || document.buffer.length === 0) throw new BadRequestException({ code: 'CANDIDATE_DOCUMENT_EMPTY', message: 'The document is empty', retryable: false });
    if (document.size > maxBytes) throw new BadRequestException({ code: 'CANDIDATE_DOCUMENT_TOO_LARGE', message: 'The document exceeds the maximum size', retryable: false });
    if (!SUPPORTED_CANDIDATE_DOCUMENT_TYPES.has(document.mimetype)) {
      throw new BadRequestException({ code: 'CANDIDATE_DOCUMENT_TYPE_UNSUPPORTED', message: 'Upload a PDF, TXT, or Markdown document', retryable: false });
    }
  }

  private async extractText(document: UploadedCandidateDocument): Promise<string> {
    if (document.mimetype !== 'application/pdf') return document.buffer.toString('utf8');
    const parser = new PDFParse({ data: document.buffer });
    try {
      return (await parser.getText()).text;
    } catch (error) {
      this.logger.warn(JSON.stringify({
        event: 'candidate_context.pdf_unreadable', errorName: error instanceof Error ? error.name : 'UnknownError'
      }));
      throw new BadRequestException({
        code: 'CANDIDATE_DOCUMENT_UNREADABLE',
        message: 'The PDF could not be read. Upload a text-based PDF, TXT, or Markdown file.',
        retryable: false
      });
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }
}

export function candidateContextKind(value: string): CandidateContextKind {
  if (value === 'profile' || value === 'job-description') return value === 'profile' ? 'profile' : 'job_description';
  throw new BadRequestException({ code: 'CANDIDATE_CONTEXT_KIND_INVALID', message: 'Context kind must be profile or job-description', retryable: false });
}

export function normalizeExtractedText(value: string, maxCharacters: number): string {
  return value
    .replaceAll('\0', '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, maxCharacters)
    .trim();
}

function boundedText(value: string, maxCharacters: number): string {
  return value.length <= maxCharacters ? value : `${value.slice(0, maxCharacters).trimEnd()}\n[Profile context truncated]`;
}

function safeFilename(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255);
  return cleaned || 'document';
}

function summary(context: CandidateContextRecord): CandidateContextSummary {
  return {
    kind: context.kind,
    sourceFilename: context.sourceFilename,
    characterCount: context.extractedText.length,
    updatedAt: context.updatedAt
  };
}
