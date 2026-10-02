import { TabAudioCapture } from './tab-capture';
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
  onSegment: (segment: FinalizedAudioSegment) => void;
  onError: (error: Error) => void;
}

interface ActiveSegment {
  startedAtMs: number;
  chunks: Blob[];
}

interface TimedChunk {
  endedAtMs: number;
  data: Blob;
}

export class VadPipeline {
  private readonly segmenter: UtteranceSegmenter;
  private analyser?: AnalyserNode;
  private recorder?: MediaRecorder;
  private sampleBuffer?: Uint8Array<ArrayBuffer>;
  private intervalId?: number;
  private activeSegment?: ActiveSegment;
  private preRollChunks: TimedChunk[] = [];
  private pendingFinalization?: { startedAtMs: number; speechEndedAtMs: number; endedAtMs: number };

  constructor(
    private readonly capture: TabAudioCapture,
    private readonly callbacks: VadPipelineCallbacks,
    private readonly configuration: VadConfiguration = DEFAULT_VAD_CONFIGURATION
  ) {
    this.segmenter = new UtteranceSegmenter(configuration);
  }

  start(): void {
    this.stop();
    const stream = this.capture.activeStream();
    if (!stream) throw new Error('Start tab capture before voice activity detection.');
    this.analyser = this.capture.createAnalyser();
    this.sampleBuffer = new Uint8Array(new ArrayBuffer(this.analyser.fftSize));
    this.recorder = new MediaRecorder(stream, this.mediaRecorderOptions());
    this.recorder.addEventListener('dataavailable', this.handleDataAvailable);
    this.recorder.addEventListener('error', this.handleRecorderError);
    this.recorder.start(this.configuration.recorderTimesliceMs);
    this.callbacks.onStateChange('listening');
    this.intervalId = window.setInterval(() => this.sample(), this.configuration.analysisIntervalMs);
  }

  stop(): void {
    if (this.intervalId !== undefined) window.clearInterval(this.intervalId);
    this.intervalId = undefined;
    this.recorder?.removeEventListener('dataavailable', this.handleDataAvailable);
    this.recorder?.removeEventListener('error', this.handleRecorderError);
    if (this.recorder?.state !== 'inactive') this.recorder?.stop();
    this.recorder = undefined;
    this.analyser?.disconnect();
    this.analyser = undefined;
    this.sampleBuffer = undefined;
    this.activeSegment = undefined;
    this.preRollChunks = [];
    this.pendingFinalization = undefined;
    this.segmenter.reset();
  }

  private sample(): void {
    if (!this.analyser || !this.sampleBuffer) return;
    this.analyser.getByteTimeDomainData(this.sampleBuffer);
    const isSpeech = this.rms(this.sampleBuffer) >= this.configuration.rmsThreshold;
    this.handleEvents(this.segmenter.observe(isSpeech, performance.now()));
  }

  private handleEvents(events: SegmenterEvent[]): void {
    for (const event of events) {
      if (event.type === 'speech_detected') {
        const startedAtMs = event.startedAtMs - this.configuration.preRollMs;
        this.activeSegment = {
          startedAtMs,
          chunks: this.preRollChunks.filter((chunk) => chunk.endedAtMs >= startedAtMs).map((chunk) => chunk.data)
        };
        this.callbacks.onStateChange('speech_detected');
      }
      if (event.type === 'finalizing') this.callbacks.onStateChange('finalizing');
      if (event.type === 'segment_ready') this.requestFinalization(event.startedAtMs, event.speechEndedAtMs, event.endedAtMs);
    }
  }

  private requestFinalization(startedAtMs: number, speechEndedAtMs: number, endedAtMs: number): void {
    if (!this.activeSegment || this.pendingFinalization || !this.recorder) return;
    this.pendingFinalization = { startedAtMs, speechEndedAtMs, endedAtMs };
    this.recorder.requestData();
  }

  private handleDataAvailable = (event: BlobEvent): void => {
    if (!event.data.size) return;
    const endedAtMs = performance.now();
    this.preRollChunks.push({ endedAtMs, data: event.data });
    this.preRollChunks = this.preRollChunks.filter((chunk) => endedAtMs - chunk.endedAtMs <= this.configuration.preRollMs);
    if (this.activeSegment) this.activeSegment.chunks.push(event.data);
    if (!this.pendingFinalization || !this.activeSegment) return;

    const pending = this.pendingFinalization;
    const active = this.activeSegment;
    this.pendingFinalization = undefined;
    this.activeSegment = undefined;
    const segment: FinalizedAudioSegment = {
      audio: new Blob(active.chunks, { type: this.recorder?.mimeType || event.data.type }),
      startedAtMs: active.startedAtMs,
      speechEndedAtMs: pending.speechEndedAtMs,
      endedAtMs: pending.endedAtMs,
      durationMs: Math.max(0, pending.endedAtMs - active.startedAtMs)
    };
    this.segmenter.completeFinalization();
    this.callbacks.onStateChange('listening');
    this.callbacks.onSegment(segment);
  };

  private handleRecorderError = (): void => {
    this.callbacks.onError(new Error('The browser audio recorder stopped unexpectedly.'));
    this.stop();
  };

  private rms(samples: Uint8Array): number {
    let total = 0;
    for (const sample of samples) {
      const normalized = (sample - 128) / 128;
      total += normalized * normalized;
    }
    return Math.sqrt(total / samples.length);
  }

  private mediaRecorderOptions(): MediaRecorderOptions {
    const mimeType = 'audio/webm;codecs=opus';
    return MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : {};
  }
}
