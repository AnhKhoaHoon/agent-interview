export interface VadConfiguration {
  minimumSpeechMs: number;
  silenceTimeoutMs: number;
  preRollMs: number;
  postRollMs: number;
  maximumUtteranceMs: number;
  analysisIntervalMs: number;
  rmsThreshold: number;
  noiseFloorSmoothing: number;
  speechToNoiseRatio: number;
  maximumAdaptiveThreshold: number;
  recorderTimesliceMs: number;
}

export const DEFAULT_VAD_CONFIGURATION: Readonly<VadConfiguration> = {
  minimumSpeechMs: 300,
  // Prefer a complete interview question over a slightly faster handoff. The
  // visible Finish control can be used once the interviewer has clearly ended.
  silenceTimeoutMs: 2_000,
  preRollMs: 250,
  postRollMs: 300,
  maximumUtteranceMs: 30_000,
  analysisIntervalMs: 50,
  rmsThreshold: 0.004,
  noiseFloorSmoothing: 0.92,
  speechToNoiseRatio: 2.4,
  maximumAdaptiveThreshold: 0.03,
  recorderTimesliceMs: 100
};
