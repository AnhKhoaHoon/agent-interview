import { TabAudioCapture, type PcmTap } from './tab-capture';
import { encodeMonoPcm16Wave } from './pcm-wave';
import { DEFAULT_VAD_CONFIGURATION, type VadConfiguration } from './vad-config';
import { UtteranceSegmenter, type SegmenterEvent, type VadUiState } from './utterance-segmenter';

export interface FinalizedAudioSegment {
  audio: Blob;
  startedAtMs: number;
  speechEndedAtMs: number;
  endedAtMs: number;
  durationMs: number;
}

export interface VadPipelineCallbacks {
  onStateChange: (state: VadUiState) => void;
  onAudioLevel: (level: number, speechThreshold: number) => void;
  onSegment: (segment: FinalizedAudioSegment) => void;
  onError: (error: Error) => void;
}

interface ActiveSegment {
  startedAtMs: number;
  chunks: Float32Array[];
}

interface TimedPcmChunk {
  endedAtMs: number;
  samples: Float32Array;
}

export class VadPipeline {
  private readonly segmenter: UtteranceSegmenter;
  private analyser?: AnalyserNode;
  private pcmTap?: PcmTap;
  private sampleBuffer?: Uint8Array<ArrayBuffer>;
  private intervalId?: number;
  private activeSegment?: ActiveSegment;
  private preRollChunks: TimedPcmChunk[] = [];
  private finalizing = false;
  private noiseFloor: number;
  private calibrationStartedAtMs?: number;
  private calibrationLevels: number[] = [];
  private calibrationComplete = false;
  private lastLevelUpdateMs = 0;

  constructor(
    private readonly capture: TabAudioCapture,
    private readonly callbacks: VadPipelineCallbacks,
    private readonly configuration: VadConfiguration = DEFAULT_VAD_CONFIGURATION
  ) {
    this.segmenter = new UtteranceSegmenter(configuration);
    this.noiseFloor = configuration.initialNoiseFloor;
  }

  async start(): Promise<void> {
    this.stop();
    if (!this.capture.activeStream()) throw new Error('Start tab capture before voice activity detection.');
    this.analyser = this.capture.createAnalyser();
    this.sampleBuffer = new Uint8Array(new ArrayBuffer(this.analyser.fftSize));
    this.pcmTap = await this.capture.createPcmTap(this.handlePcmSamples);
    this.calibrationStartedAtMs = performance.now();
    this.calibrationLevels = [];
    this.calibrationComplete = false;
    this.callbacks.onStateChange('listening');
    this.intervalId = window.setInterval(() => this.sample(), this.configuration.analysisIntervalMs);
  }

  stop(): void {
    if (this.intervalId !== undefined) window.clearInterval(this.intervalId);
    this.intervalId = undefined;
    this.pcmTap?.stop();
    this.pcmTap = undefined;
    this.analyser?.disconnect();
    this.analyser = undefined;
    this.sampleBuffer = undefined;
    this.activeSegment = undefined;
    this.preRollChunks = [];
    this.finalizing = false;
    this.noiseFloor = this.configuration.initialNoiseFloor;
    this.calibrationStartedAtMs = undefined;
    this.calibrationLevels = [];
    this.calibrationComplete = false;
    this.lastLevelUpdateMs = 0;
    this.segmenter.reset();
  }

  /** Finish the active utterance after the interviewer has clearly ended the question. */
  finishCurrentUtterance(): void {
    this.handleEvents(this.segmenter.finishCurrentUtterance(performance.now()));
  }

  /** Discards the active local utterance without uploading it or stopping capture. */
  cancelCurrentUtterance(): boolean {
    if (!this.segmenter.cancelCurrentUtterance()) return false;
    this.activeSegment = undefined;
    this.finalizing = false;
    this.callbacks.onStateChange('listening');
    return true;
  }

  private sample(): void {
    if (!this.analyser || !this.sampleBuffer) return;
    this.analyser.getByteTimeDomainData(this.sampleBuffer);
    const level = this.rms(this.sampleBuffer);
    const nowMs = performance.now();
    if (!this.calibrationComplete) {
      this.calibrationLevels.push(level);
      const calibrationStartedAtMs = this.calibrationStartedAtMs ?? nowMs;
      if (nowMs - calibrationStartedAtMs < this.configuration.initialCalibrationMs) {
        this.notifyAudioLevel(level, adaptiveSpeechThreshold(this.noiseFloor, this.configuration), nowMs);
        return;
      }
      this.noiseFloor = initialNoiseFloor(this.calibrationLevels, this.configuration);
      this.calibrationComplete = true;
    }

    const thresholdBeforeUpdate = adaptiveSpeechThreshold(this.noiseFloor, this.configuration);
    // Do not learn a speech candidate as the noise floor. The previous logic
    // raised the threshold above a quiet, steady voice before the 300ms speech
    // minimum elapsed, so no utterance was ever created for STT.
    if (shouldUpdateNoiseFloor(level, thresholdBeforeUpdate)) this.noiseFloor = nextNoiseFloor(this.noiseFloor, level, this.configuration);
    const threshold = adaptiveSpeechThreshold(this.noiseFloor, this.configuration);
    this.notifyAudioLevel(level, threshold, nowMs);
    this.handleEvents(this.segmenter.observe(level >= threshold, nowMs));
  }

  private notifyAudioLevel(level: number, threshold: number, nowMs: number): void {
    if (nowMs - this.lastLevelUpdateMs < 100) return;
    this.lastLevelUpdateMs = nowMs;
    this.callbacks.onAudioLevel(level, threshold);
  }

  private handleEvents(events: SegmenterEvent[]): void {
    for (const event of events) {
      if (event.type === 'speech_detected') {
        const startedAtMs = event.startedAtMs - this.configuration.preRollMs;
        this.activeSegment = {
          startedAtMs,
          chunks: this.preRollChunks
            .filter((chunk) => chunk.endedAtMs >= startedAtMs)
            .map((chunk) => chunk.samples)
        };
        this.callbacks.onStateChange('speech_detected');
      }
      if (event.type === 'finalizing') this.callbacks.onStateChange('finalizing');
      if (event.type === 'segment_ready') this.finalize(event.startedAtMs, event.speechEndedAtMs, event.endedAtMs);
    }
  }

  private handlePcmSamples = (samples: Float32Array): void => {
    const endedAtMs = performance.now();
    this.preRollChunks.push({ endedAtMs, samples });
    const retainedWindowMs = this.configuration.minimumSpeechMs + this.configuration.preRollMs;
    this.preRollChunks = this.preRollChunks.filter((chunk) => endedAtMs - chunk.endedAtMs <= retainedWindowMs);
    if (this.activeSegment) this.activeSegment.chunks.push(samples);
  };

  private finalize(_startedAtMs: number, speechEndedAtMs: number, endedAtMs: number): void {
    if (!this.activeSegment || !this.pcmTap || this.finalizing) return;
    this.finalizing = true;
    const active = this.activeSegment;
    this.activeSegment = undefined;
    try {
      const audio = encodeMonoPcm16Wave(active.chunks, this.pcmTap.sampleRate);
      if (audio.size <= 44) throw new Error('The finalized utterance contains no audio samples.');
      this.segmenter.completeFinalization();
      this.callbacks.onStateChange('listening');
      this.callbacks.onSegment({
        audio,
        startedAtMs: active.startedAtMs,
        speechEndedAtMs,
        endedAtMs,
        durationMs: Math.max(0, endedAtMs - active.startedAtMs)
      });
    } catch (error) {
      this.callbacks.onError(error instanceof Error ? error : new Error('Audio finalization failed.'));
    } finally {
      this.finalizing = false;
    }
  }

  private rms(samples: Uint8Array): number {
    let total = 0;
    for (const sample of samples) {
      const normalized = (sample - 128) / 128;
      total += normalized * normalized;
    }
    return Math.sqrt(total / samples.length);
  }
}

export function adaptiveSpeechThreshold(noiseFloor: number, configuration: VadConfiguration): number {
  return Math.min(
    configuration.maximumAdaptiveThreshold,
    Math.max(configuration.rmsThreshold, noiseFloor * configuration.speechToNoiseRatio)
  );
}

export function nextNoiseFloor(noiseFloor: number, level: number, configuration: VadConfiguration): number {
  return configuration.noiseFloorSmoothing * noiseFloor + (1 - configuration.noiseFloorSmoothing) * level;
}

export function shouldUpdateNoiseFloor(level: number, threshold: number): boolean {
  return level < threshold;
}

/**
 * Uses a low percentile instead of a mean so short speech peaks during capture
 * start do not become the tab's noise floor. If the first window itself looks
 * like speech, retain the conservative initial floor; pre-roll preserves it.
 */
export function initialNoiseFloor(levels: number[], configuration: VadConfiguration): number {
  if (!levels.length) return configuration.initialNoiseFloor;
  const ordered = [...levels].sort((left, right) => left - right);
  const floor = percentile(ordered, 0.2);
  const high = percentile(ordered, 0.9);
  const looksLikeSpeech = high >= Math.max(
    floor * configuration.calibrationSpeechDynamicRange,
    configuration.rmsThreshold * configuration.calibrationSpeechDynamicRange
  );
  return looksLikeSpeech ? configuration.initialNoiseFloor : Math.max(configuration.initialNoiseFloor, floor);
}

function percentile(sortedValues: number[], percentileValue: number): number {
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.floor((sortedValues.length - 1) * percentileValue)));
  return sortedValues[index] ?? 0;
}
