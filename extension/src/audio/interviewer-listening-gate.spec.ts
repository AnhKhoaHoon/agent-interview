import { describe, expect, it } from 'vitest';
import { InterviewerListeningGate } from './interviewer-listening-gate';

describe('InterviewerListeningGate', () => {
  it('is closed by default and only accepts segments while explicitly listening', () => {
    const gate = new InterviewerListeningGate();

    expect(gate.isListening()).toBe(false);
    expect(gate.acceptsSegment()).toBe(false);

    gate.start();
    expect(gate.isListening()).toBe(true);
    expect(gate.acceptsSegment()).toBe(true);

    gate.pause();
    expect(gate.acceptsSegment()).toBe(false);
  });

  it('stays closed after reset for the next interviewer turn', () => {
    const gate = new InterviewerListeningGate();
    gate.start();
    gate.reset();

    expect(gate.isListening()).toBe(false);
  });
});
