import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InterviewLanguage } from '../ai/contracts';
import { InterviewService } from '../interview/interview.service';
import { InterviewRepository } from '../persistence/interview.repository';
import { DEVOPS_TRANSCRIPTION_KEYWORDS, devopsTranscriptionPrompt } from '../roles/devops/devops-transcription-prompt';
import { DBA_TRANSCRIPTION_KEYWORDS, dbaTranscriptionPrompt } from '../roles/dba/dba-transcription-prompt';
import { SttProviderFactory } from './providers/stt-provider.factory';
import { normalizeAudioContentType, SUPPORTED_AUDIO_TYPES, transcriptionConfiguration } from './transcription.config';

export interface UploadedAudio {
  buffer: Buffer;
  size: number;
  mimetype: string;
  originalname: string;
}

export interface TranscriptionResponse {
  messageId: string;
  questionId: string;
  text: string;
  understoodText?: string;
  language: string;
  durationMs: number;
}

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private readonly transcriptionsBySegment = new Map<string, Promise<TranscriptionResponse>>();

  constructor(
    private readonly providers: SttProviderFactory,
    private readonly interviews: InterviewService,
    private readonly repository: InterviewRepository
  ) {}

  async transcribe(
    interviewId: string,
    audio: UploadedAudio | undefined,
    durationMs: number,
    metadata: { segmentId?: string; speechEndedAtMs?: number; language?: InterviewLanguage; requestId?: string } = {}
  ): Promise<TranscriptionResponse> {
    try {
      this.validateAudio(audio, durationMs);
    } catch (error) {
      this.logger.warn(JSON.stringify({
        event: 'stt.upload.rejected',
        requestId: metadata.requestId,
        interviewId,
        segmentId: metadata.segmentId,
        durationMs,
        audioPresent: Boolean(audio),
        ...(audio ? { audioBytes: audio.size, mimeType: audio.mimetype } : {}),
        ...this.errorDetails(error)
      }));
      throw error;
    }
    const normalizedAudio = { ...audio, mimetype: normalizeAudioContentType(audio.mimetype) };
    if (!metadata.segmentId) return this.transcribeNew(interviewId, normalizedAudio, durationMs, metadata);

    const key = `${interviewId}:${metadata.segmentId}`;
    const existing = this.transcriptionsBySegment.get(key);
    if (existing) {
      this.logger.log(JSON.stringify({ event: 'stt.upload.deduplicated', requestId: metadata.requestId, interviewId, segmentId: metadata.segmentId }));
      return existing;
    }
    const persisted = await this.repository.findTranscriptionBySegment(interviewId, metadata.segmentId);
    if (persisted) {
      this.logger.log(JSON.stringify({
        event: 'stt.upload.deduplicated', requestId: metadata.requestId, interviewId,
        segmentId: metadata.segmentId, source: 'postgres'
      }));
      return persisted;
    }
    const operation = this.transcribeNew(interviewId, normalizedAudio, durationMs, metadata);
    this.transcriptionsBySegment.set(key, operation);
    try {
      return await operation;
    } finally {
      if (this.transcriptionsBySegment.get(key) === operation) this.transcriptionsBySegment.delete(key);
    }
  }

  private async transcribeNew(
    interviewId: string,
    audio: UploadedAudio,
    durationMs: number,
    metadata: { segmentId?: string; speechEndedAtMs?: number; language?: InterviewLanguage; requestId?: string }
  ): Promise<TranscriptionResponse> {
    await this.interviews.transcriptionStarted(interviewId, durationMs);
    const interview = await this.interviews.get(interviewId);
    const transcriptionGuidance = interview.role === 'dba'
      ? { keywords: DBA_TRANSCRIPTION_KEYWORDS, prompt: dbaTranscriptionPrompt }
      : { keywords: DEVOPS_TRANSCRIPTION_KEYWORDS, prompt: devopsTranscriptionPrompt };
    const startedAt = Date.now();
    let providerName = 'unresolved';
    try {
      const provider = this.providers.getConfiguredProvider();
      providerName = provider.name;
      this.logger.log(JSON.stringify({
        event: 'stt.provider.started',
        requestId: metadata.requestId,
        interviewId,
        segmentId: metadata.segmentId,
        provider: providerName,
        audioBytes: audio.size,
        mimeType: audio.mimetype,
        durationMs,
        ...(metadata.language ? { language: metadata.language } : {})
      }));
      const result = await provider.transcribe(audio.buffer, {
        durationMs,
        mimeType: audio.mimetype,
        filename: audio.originalname || 'utterance.webm',
        ...(metadata.language ? {
          language: metadata.language,
          prompt: transcriptionGuidance.prompt(metadata.language),
          keywords: transcriptionGuidance.keywords
        } : {})
      });
      if (!result.text.trim()) throw new ServiceUnavailableException({ code: 'STT_EMPTY_RESULT', message: 'Speech provider returned no transcript', retryable: true });
      const message = await this.interviews.recordTranscript(interviewId, result.text.trim(), {
        segmentId: metadata.segmentId,
        speechEndedAtMs: metadata.speechEndedAtMs,
        ...(metadata.language ? { answerLanguage: metadata.language } : {})
      });
      const sttLatencyMs = Date.now() - startedAt;
      await this.repository.saveTranscription({
        id: randomUUID(), interviewId, messageId: message.id, questionId: message.id,
        text: message.content, language: result.language, durationMs,
        ...(metadata.segmentId ? { segmentId: metadata.segmentId } : {}),
        provider: result.provider, latencyMs: sttLatencyMs
      });
      this.logger.log(JSON.stringify({
        event: 'stt.completed',
        requestId: metadata.requestId,
        interviewId,
        questionId: message.id,
        segmentId: metadata.segmentId,
        provider: result.provider,
        audioBytes: audio.size,
        mimeType: audio.mimetype,
        durationMs,
        transcriptCharacterCount: result.text.trim().length,
        sttLatencyMs
      }));
      return {
        messageId: message.id, questionId: message.id, text: message.content,
        ...(message.understoodText ? { understoodText: message.understoodText } : {}),
        language: result.language, durationMs
      };
    } catch (error) {
      this.logger.error(JSON.stringify({
        event: 'stt.failed',
        requestId: metadata.requestId,
        interviewId,
        segmentId: metadata.segmentId,
        provider: providerName,
        audioBytes: audio.size,
        mimeType: audio.mimetype,
        durationMs,
        sttLatencyMs: Date.now() - startedAt,
        ...this.errorDetails(error)
      }));
      if (error instanceof ServiceUnavailableException) throw error;
      const providerStatus = this.providerStatus(error);
      if (providerStatus === 401 || providerStatus === 403) {
        throw new ServiceUnavailableException({
          code: 'STT_CREDENTIALS_REJECTED',
          message: 'Speech provider credentials were rejected. Check the backend STT_API_KEY.',
          retryable: false
        });
      }
      if (providerStatus === 429) {
        throw new ServiceUnavailableException({
          code: 'STT_RATE_LIMITED',
          message: 'Speech provider rate limit reached. Retry shortly.',
          retryable: true
        });
      }
      if (providerStatus === 400 || providerStatus === 413 || providerStatus === 415) {
        throw new ServiceUnavailableException({
          code: 'STT_AUDIO_REJECTED',
          message: 'Speech provider rejected the captured audio. Start capture again and retry.',
          retryable: true
        });
      }
      throw new ServiceUnavailableException({ code: 'STT_TRANSCRIPTION_FAILED', message: 'Speech transcription failed', retryable: true });
    }
  }

  private validateAudio(audio: UploadedAudio | undefined, durationMs: number): asserts audio is UploadedAudio {
    const { maxAudioBytes, maxDurationMs } = transcriptionConfiguration();
    if (!audio) throw new BadRequestException({ code: 'AUDIO_FILE_REQUIRED', message: 'An audio file is required', retryable: false });
    if (!SUPPORTED_AUDIO_TYPES.has(normalizeAudioContentType(audio.mimetype))) {
      throw new BadRequestException({ code: 'AUDIO_TYPE_UNSUPPORTED', message: 'Unsupported audio content type', retryable: false });
    }
    if (audio.size === 0 || audio.buffer.length === 0) {
      throw new BadRequestException({ code: 'AUDIO_FILE_EMPTY', message: 'Audio file must not be empty', retryable: false });
    }
    if (audio.size > maxAudioBytes) {
      throw new BadRequestException({ code: 'AUDIO_FILE_TOO_LARGE', message: 'Audio file exceeds the maximum size', retryable: false });
    }
    if (!Number.isInteger(durationMs) || durationMs < 1 || durationMs > maxDurationMs) {
      throw new BadRequestException({ code: 'AUDIO_DURATION_INVALID', message: 'Audio duration is outside the permitted range', retryable: false });
    }
  }

  private errorDetails(error: unknown): Record<string, string | number> {
    const providerError = error as { status?: unknown; code?: unknown; type?: unknown };
    return {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorMessage: error instanceof Error ? error.message : 'Speech transcription failed',
      ...(typeof providerError.status === 'number' ? { providerStatus: providerError.status } : {}),
      ...(typeof providerError.code === 'string' ? { providerCode: providerError.code } : {}),
      ...(typeof providerError.type === 'string' ? { providerType: providerError.type } : {})
    };
  }

  private providerStatus(error: unknown): number | undefined {
    const status = (error as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }
}
