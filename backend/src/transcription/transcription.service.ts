import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { InterviewService } from '../interview/interview.service';
import { SttProviderFactory } from './providers/stt-provider.factory';
import { SUPPORTED_AUDIO_TYPES, transcriptionConfiguration } from './transcription.config';

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
  language: string;
  durationMs: number;
}

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private readonly transcriptionsBySegment = new Map<string, Promise<TranscriptionResponse>>();

  constructor(private readonly providers: SttProviderFactory, private readonly interviews: InterviewService) {}

  async transcribe(
    interviewId: string,
    audio: UploadedAudio | undefined,
    durationMs: number,
    metadata: { segmentId?: string; speechEndedAtMs?: number } = {}
  ): Promise<TranscriptionResponse> {
    this.validateAudio(audio, durationMs);
    if (!metadata.segmentId) return this.transcribeNew(interviewId, audio, durationMs, metadata);

    const key = `${interviewId}:${metadata.segmentId}`;
    const existing = this.transcriptionsBySegment.get(key);
    if (existing) return existing;
    const operation = this.transcribeNew(interviewId, audio, durationMs, metadata);
    this.transcriptionsBySegment.set(key, operation);
    try {
      return await operation;
    } catch (error) {
      if (this.transcriptionsBySegment.get(key) === operation) this.transcriptionsBySegment.delete(key);
      throw error;
    }
  }

  private async transcribeNew(
    interviewId: string,
    audio: UploadedAudio,
    durationMs: number,
    metadata: { segmentId?: string; speechEndedAtMs?: number }
  ): Promise<TranscriptionResponse> {
    this.interviews.transcriptionStarted(interviewId, durationMs);
    const startedAt = Date.now();
    let providerName = 'unresolved';
    try {
      const provider = this.providers.getConfiguredProvider();
      providerName = provider.name;
      const result = await provider.transcribe(audio.buffer, {
        durationMs,
        mimeType: audio.mimetype,
        filename: audio.originalname || 'utterance.webm'
      });
      if (!result.text.trim()) throw new ServiceUnavailableException({ code: 'STT_EMPTY_RESULT', message: 'Speech provider returned no transcript', retryable: true });
      const message = this.interviews.recordTranscript(interviewId, result.text.trim(), metadata);
      const sttLatencyMs = Date.now() - startedAt;
      this.logger.log(JSON.stringify({ event: 'stt.completed', interviewId, questionId: message.id, provider: result.provider, sttLatencyMs }));
      return { messageId: message.id, questionId: message.id, text: message.content, language: result.language, durationMs };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Speech transcription failed';
      this.logger.error(JSON.stringify({ event: 'stt.failed', interviewId, provider: providerName, error: message }));
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException({ code: 'STT_TRANSCRIPTION_FAILED', message: 'Speech transcription failed', retryable: true });
    }
  }

  private validateAudio(audio: UploadedAudio | undefined, durationMs: number): asserts audio is UploadedAudio {
    const { maxAudioBytes, maxDurationMs } = transcriptionConfiguration();
    if (!audio) throw new BadRequestException({ code: 'AUDIO_FILE_REQUIRED', message: 'An audio file is required', retryable: false });
    if (!SUPPORTED_AUDIO_TYPES.has(audio.mimetype)) {
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
}
