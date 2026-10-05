import { Injectable } from '@nestjs/common';

const LEADING_FILLER = /^(?:(?:um+|uh+|erm+|you know)[,\s]*)+/i;

/**
 * These are deliberately narrow, observed STT pronunciations of DevOps product
 * names. They are applied only to the AI interpretation, while the original
 * provider transcript remains visible to the user.
 */
const TECHNICAL_TERM_ALIASES: ReadonlyArray<{ pattern: RegExp; canonical: string }> = [
  { pattern: /\b(?:zen\s*tin|gen\s*kin(?:s)?|jen\s*kin(?:s)?)\b/giu, canonical: 'Jenkins' },
  { pattern: /\bgit\s*lab\b/giu, canonical: 'GitLab' },
  { pattern: /\bargo\s*(?:cd|si\s*đi)\b/giu, canonical: 'Argo CD' },
  { pattern: /\bterra\s*form\b/giu, canonical: 'Terraform' },
  { pattern: /\bkuber\s*net(?:es)?\b/giu, canonical: 'Kubernetes' },
  // "Azure landing page" is a common STT substitution for the Azure architecture term.
  // Do not rewrite an unqualified "landing page", which can be a valid web concept.
  { pattern: /\bazure\s+landing\s+page\b/giu, canonical: 'Azure Landing Zone' }
];

export interface TranscriptInterpretation {
  text: string;
  corrections: Array<{ heard: string; interpretedAs: string }>;
}

@Injectable()
export class TranscriptNormalizerService {
  normalize(transcript: string): string {
    return this.interpret(transcript).text;
  }

  interpret(transcript: string): TranscriptInterpretation {
    let text = transcript.replace(/\s+/g, ' ').trim().replace(LEADING_FILLER, '').trim();
    const corrections: TranscriptInterpretation['corrections'] = [];
    for (const alias of TECHNICAL_TERM_ALIASES) {
      text = text.replace(alias.pattern, (heard: string) => {
        corrections.push({ heard, interpretedAs: alias.canonical });
        return alias.canonical;
      });
    }
    return { text, corrections };
  }
}
