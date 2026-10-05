import type { VadConfiguration } from './vad-config';

export type VadUiState = 'listening' | 'speech_detected' | 'finalizing';

export type SegmenterEvent =
  | { type: 'speech_detected'; startedAtMs: number }
  | { type: 'finalizing'; startedAtMs: number; speechEndedAtMs: number; finalizesAtMs: number }
  | { type: 'segment_ready'; startedAtMs: number; speechEndedAtMs: number; endedAtMs: number };

export class UtteranceSegmenter {
  private state: VadUiState = 'listening';
  private candidateSpeechStartedAtMs?: number;
  private utteranceStartedAtMs?: number;
  private silenceStartedAtMs?: number;
  private speechEndedAtMs?: number;
  private finalizesAtMs?: number;
  private emittedReady = false;

  constructor(private readonly configuration: VadConfiguration) {}

  observe(isSpeech: boolean, nowMs: number): SegmenterEvent[] {
    if (this.state === 'finalizing') return this.advanceFinalization(nowMs);

    if (this.state === 'listening') {
      if (!isSpeech) {
        this.candidateSpeechStartedAtMs = undefined;
        return [];
      }
      this.candidateSpeechStartedAtMs ??= nowMs;
      if (nowMs - this.candidateSpeechStartedAtMs < this.configuration.minimumSpeechMs) return [];
      this.utteranceStartedAtMs = this.candidateSpeechStartedAtMs;
      this.candidateSpeechStartedAtMs = undefined;
      this.state = 'speech_detected';
      return [{ type: 'speech_detected', startedAtMs: this.utteranceStartedAtMs }];
    }

    if (isSpeech) this.silenceStartedAtMs = undefined;
    else this.silenceStartedAtMs ??= nowMs;

    if (nowMs - this.utteranceStartedAtMs! >= this.configuration.maximumUtteranceMs) return this.beginFinalization(nowMs);
    if (this.silenceStartedAtMs !== undefined && nowMs - this.silenceStartedAtMs >= this.configuration.silenceTimeoutMs) {
      return this.beginFinalization(nowMs);
    }
    return [];
  }

  tick(nowMs: number): SegmenterEvent[] {
    if (this.state === 'finalizing') return this.advanceFinalization(nowMs);
    if (this.state !== 'speech_detected') return [];
    return this.observe(false, nowMs);
  }

  /** Explicitly ends the current interviewer turn after the user confirms it is complete. */
  finishCurrentUtterance(nowMs: number): SegmenterEvent[] {
    if (this.state !== 'speech_detected') return [];
    return this.beginFinalization(nowMs);
  }

  /** Discards a locally detected utterance before it becomes an audio segment. */
  cancelCurrentUtterance(): boolean {
    if (this.state === 'listening') return false;
    this.reset();
    return true;
  }

  completeFinalization(): void {
    if (this.state !== 'finalizing' || !this.emittedReady) return;
    this.state = 'listening';
    this.candidateSpeechStartedAtMs = undefined;
    this.utteranceStartedAtMs = undefined;
    this.silenceStartedAtMs = undefined;
    this.speechEndedAtMs = undefined;
    this.finalizesAtMs = undefined;
    this.emittedReady = false;
  }

  currentState(): VadUiState {
    return this.state;
  }

  reset(): void {
    this.state = 'listening';
    this.candidateSpeechStartedAtMs = undefined;
    this.utteranceStartedAtMs = undefined;
    this.silenceStartedAtMs = undefined;
    this.speechEndedAtMs = undefined;
    this.finalizesAtMs = undefined;
    this.emittedReady = false;
  }

  private beginFinalization(nowMs: number): SegmenterEvent[] {
    this.state = 'finalizing';
    this.speechEndedAtMs = this.silenceStartedAtMs ?? nowMs;
    this.finalizesAtMs = nowMs + this.configuration.postRollMs;
    return [{ type: 'finalizing', startedAtMs: this.utteranceStartedAtMs!, speechEndedAtMs: this.speechEndedAtMs, finalizesAtMs: this.finalizesAtMs }];
  }

  private advanceFinalization(nowMs: number): SegmenterEvent[] {
    if (this.emittedReady || this.finalizesAtMs === undefined || nowMs < this.finalizesAtMs) return [];
    this.emittedReady = true;
    return [{ type: 'segment_ready', startedAtMs: this.utteranceStartedAtMs!, speechEndedAtMs: this.speechEndedAtMs!, endedAtMs: this.finalizesAtMs }];
  }
}
