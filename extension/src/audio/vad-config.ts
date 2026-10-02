export interface VadConfiguration {
  minimumSpeechMs: number;
  silenceTimeoutMs: number;
  preRollMs: number;
  postRollMs: number;
  maximumUtteranceMs: number;
  analysisIntervalMs: number;
  rmsThreshold: number;
  recorderTimesliceMs: number;
}

export const DEFAULT_VAD_CONFIGURATION: Readonly<VadConfiguration> = {
  minimumSpeechMs: 300,
  silenceTimeoutMs: 900,
  preRollMs: 250,
  postRollMs: 300,
  maximumUtteranceMs: 30_000,
  analysisIntervalMs: 50,
  rmsThreshold: 0.018,
  recorderTimesliceMs: 100
};
