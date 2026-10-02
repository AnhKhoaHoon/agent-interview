import { Injectable } from '@nestjs/common';

const LEADING_FILLER = /^(?:(?:um+|uh+|erm+|you know)[,\s]*)+/i;

@Injectable()
export class TranscriptNormalizerService {
  normalize(transcript: string): string {
    // Deliberately only make lossless, transcript-level changes. In particular,
    // do not case-fold or replace tokens such as HPA, tfstate, or kubectl.
    return transcript.replace(/\s+/g, ' ').trim().replace(LEADING_FILLER, '').trim();
  }
}
