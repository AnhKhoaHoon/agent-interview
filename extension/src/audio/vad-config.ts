export interface VadConfiguration {
  initialCalibrationMs: number;
  initialNoiseFloor: number;
  calibrationSpeechDynamicRange: number;
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
  // Meet and other conferencing tabs have a persistent low-level audio bed.
  // Sample it before opening an utterance so it is not mistaken for speech.
  initialCalibrationMs: 650,
  initialNoiseFloor: 0.001,
  calibrationSpeechDynamicRange: 2.2,
  minimumSpeechMs: 300,
  // One second keeps the answer responsive; Finish remains available when an
  // interviewer ends a question more quickly or needs an explicit handoff.
  silenceTimeoutMs: 1_000,
  // Keep the beginning of a question spoken while the tab is calibrating.
  preRollMs: 900,
  postRollMs: 300,
  maximumUtteranceMs: 30_000,
  analysisIntervalMs: 50,
  rmsThreshold: 0.004,
  noiseFloorSmoothing: 0.92,
  speechToNoiseRatio: 1.7,
  maximumAdaptiveThreshold: 0.03,
  recorderTimesliceMs: 100
};
