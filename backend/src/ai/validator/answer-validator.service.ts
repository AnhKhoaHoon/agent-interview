import { Injectable } from '@nestjs/common';
import { Classification } from '../contracts';

export interface ValidationResult {
  valid: boolean;
  reasons: string[];
  warnings?: string[];
}

@Injectable()
export class AnswerValidatorService {
  validate(answer: string, classification: Classification, minWords = classification.responseMode === 'clarification' ? 1 : 60, maxWords = 120): ValidationResult {
    const normalized = answer.trim();
    const wordCount = normalized ? normalized.split(/\s+/).length : 0;
    const reasons: string[] = [];
    if (wordCount < minWords) reasons.push('answer is shorter than the configured minimum');
    const warnings: string[] = [];
    // Tokens have already been streamed to the Side Panel. A response that is
    // otherwise accurate must not be replaced by an error merely because it is
    // slightly long; the prompt and output budget prevent this in normal flow.
    if (wordCount > maxWords) warnings.push('answer exceeds the desired word range');
    if (/\b(as an ai|i cannot access|system prompt|instructions say)\b/i.test(normalized)) reasons.push('answer contains assistant meta-language');
    if (classification.type === 'experience' && /\b(i led|i built|my team|at my company)\b/i.test(normalized)) {
      reasons.push('experience answer contains unverified first-person claims');
    }
    return { valid: reasons.length === 0, reasons, ...(warnings.length ? { warnings } : {}) };
  }
}
