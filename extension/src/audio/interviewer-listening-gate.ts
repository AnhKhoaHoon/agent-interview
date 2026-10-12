/**
 * User-controlled boundary between selected-tab capture and STT.
 *
 * A conferencing tab can contain both remote and local meeting audio. The
 * gate is closed by default, so a segment is eligible for transcription only
 * during a deliberate interviewer-listening window.
 */
export class InterviewerListeningGate {
  private enabled = false;

  start(): void {
    this.enabled = true;
  }

  pause(): void {
    this.enabled = false;
  }

  reset(): void {
    this.enabled = false;
  }

  isListening(): boolean {
    return this.enabled;
  }

  acceptsSegment(): boolean {
    return this.enabled;
  }
}
