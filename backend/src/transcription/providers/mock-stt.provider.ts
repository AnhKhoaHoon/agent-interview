import { Injectable } from '@nestjs/common';
import { SttProvider, TranscriptionOptions, TranscriptionResult } from '../stt-provider';

@Injectable()
export class MockSttProvider implements SttProvider {
  readonly name = 'mock';

  async transcribe(_audio: Buffer, _options: TranscriptionOptions): Promise<TranscriptionResult> {
    return { text: 'What is Kubernetes HPA?', language: 'en', provider: this.name };
  }
}
