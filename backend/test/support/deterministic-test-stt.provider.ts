import { SttProvider, TranscriptionOptions, TranscriptionResult } from '../../src/transcription/stt-provider';

export class DeterministicTestSttProvider implements SttProvider {
  readonly name = 'deterministic-test-double';
  lastOptions?: TranscriptionOptions;

  async transcribe(_audio: Buffer, options: TranscriptionOptions): Promise<TranscriptionResult> {
    this.lastOptions = options;
    return { text: 'What is Kubernetes HPA?', language: 'en', provider: this.name };
  }
}
