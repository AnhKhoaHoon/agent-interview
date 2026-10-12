import { Injectable } from '@nestjs/common';
import { InterviewRole } from '../../roles/interview-role';

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

const DBA_TERM_ALIASES: ReadonlyArray<{ pattern: RegExp; canonical: string }> = [
  { pattern: /\bpost\s*(?:grass|gres|gre|gresh)\b/giu, canonical: 'PostgreSQL' },
  { pattern: /\bmy\s*sequel\b/giu, canonical: 'MySQL' },
  { pattern: /\bsql\s*server\b/giu, canonical: 'SQL Server' },
  { pattern: /\bexplain(?:ed)?\s+analyze\b/giu, canonical: 'EXPLAIN ANALYZE' },
  { pattern: /\bauto\s*vacuum\b/giu, canonical: 'autovacuum' },
  { pattern: /\bpoint\s+in\s+time\s+recovery\b/giu, canonical: 'point-in-time recovery' }
];

export interface TranscriptInterpretation {
  text: string;
  corrections: Array<{ heard: string; interpretedAs: string }>;
}

@Injectable()
export class TranscriptNormalizerService {
  normalize(transcript: string, role: InterviewRole = 'devops'): string {
    return this.interpret(transcript, role).text;
  }

  interpret(transcript: string, role: InterviewRole = 'devops'): TranscriptInterpretation {
    let text = transcript.replace(/\s+/g, ' ').trim().replace(LEADING_FILLER, '').trim();
    const corrections: TranscriptInterpretation['corrections'] = [];
    const aliases = role === 'dba' ? DBA_TERM_ALIASES : TECHNICAL_TERM_ALIASES;
    for (const alias of aliases) {
      text = text.replace(alias.pattern, (heard: string) => {
        corrections.push({ heard, interpretedAs: alias.canonical });
        return alias.canonical;
      });
    }
    return { text, corrections };
  }
}
