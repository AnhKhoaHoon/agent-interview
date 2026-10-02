import { describe, expect, it } from 'vitest';
import { DEFAULT_VAD_CONFIGURATION } from './vad-config';
import { UtteranceSegmenter } from './utterance-segmenter';

describe('UtteranceSegmenter', () => {
  it('ignores silence and speech shorter than the minimum duration', () => {
    const segmenter = new UtteranceSegmenter(DEFAULT_VAD_CONFIGURATION);
    expect(segmenter.observe(false, 0)).toEqual([]);
    expect(segmenter.observe(true, 100)).toEqual([]);
    expect(segmenter.observe(false, 350)).toEqual([]);
    expect(segmenter.currentState()).toBe('listening');
  });

  it('starts after minimum speech and finalizes after silence plus post-roll', () => {
    const segmenter = new UtteranceSegmenter(DEFAULT_VAD_CONFIGURATION);
    expect(segmenter.observe(true, 0)).toEqual([]);
    expect(segmenter.observe(true, 300)).toEqual([{ type: 'speech_detected', startedAtMs: 0 }]);
    expect(segmenter.currentState()).toBe('speech_detected');
    expect(segmenter.observe(false, 350)).toEqual([]);
    expect(segmenter.tick(1_250)).toEqual([{ type: 'finalizing', startedAtMs: 0, speechEndedAtMs: 350, finalizesAtMs: 1_550 }]);
    expect(segmenter.currentState()).toBe('finalizing');
    expect(segmenter.tick(1_549)).toEqual([]);
    expect(segmenter.tick(1_550)).toEqual([{ type: 'segment_ready', startedAtMs: 0, speechEndedAtMs: 350, endedAtMs: 1_550 }]);
    segmenter.completeFinalization();
    expect(segmenter.currentState()).toBe('listening');
  });

  it('does not overlap finalization with another segment', () => {
    const segmenter = new UtteranceSegmenter(DEFAULT_VAD_CONFIGURATION);
    segmenter.observe(true, 0);
    segmenter.observe(true, 300);
    segmenter.observe(false, 400);
    segmenter.tick(1_300);

    expect(segmenter.observe(true, 1_400)).toEqual([]);
    expect(segmenter.currentState()).toBe('finalizing');
  });
});
