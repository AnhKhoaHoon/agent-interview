import { Injectable } from '@nestjs/common';
import { Classification } from '../contracts';

export interface ValidationResult {
  valid: boolean;
  reasons: string[];
}

@Injectable()
export class AnswerValidatorService {
  validate(answer: string, classification: Classification, maxWords = 120): ValidationResult {
    const normalized = answer.trim();
    const wordCount = normalized ? normalized.split(/\s+/).length : 0;
    const reasons: string[] = [];
    const minimumWords = classification.responseMode === 'clarification' ? 1 : 60;
    if (wordCount < minimumWords || wordCount > maxWords) reasons.push('answer length is outside the configured bounds');
    if (/\b(as an ai|i cannot access|system prompt|instructions say)\b/i.test(normalized)) reasons.push('answer contains assistant meta-language');
    if (classification.type === 'experience' && /\b(i led|i built|my team|at my company)\b/i.test(normalized)) {
      reasons.push('experience answer contains unverified first-person claims');
    }
    return { valid: reasons.length === 0, reasons };
  }
}
