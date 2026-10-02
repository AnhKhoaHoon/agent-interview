import { Injectable } from '@nestjs/common';
import { Classification, InterviewAnswerPlan } from '../contracts';
import { AnswerValidatorService, ValidationResult } from '../validator/answer-validator.service';

@Injectable()
export class InterviewAnswerQualityService {
  constructor(private readonly validator: AnswerValidatorService) {}

  evaluate(answer: string, classification: Classification, plan: InterviewAnswerPlan): ValidationResult {
    const result = this.validator.validate(answer, classification, plan.maxWords);
    const normalized = answer.trim();
    const reasons = [...result.reasons];

    if (/^(?:certainly|sure|of course|great question)[,!\s]/i.test(normalized)) {
      reasons.push('answer starts with a generic assistant greeting');
    }
    if (/^#{1,6}\s|^[-*]\s/m.test(normalized)) {
      reasons.push('answer uses formatting that is unsuitable for a spoken answer');
    }
    if (plan.responseMode === 'clarification' && (!normalized.endsWith('?') || /[?].+[?]/.test(normalized))) {
      reasons.push('clarification must be one targeted question');
    }
    if (plan.requiresOperationalDetail && !/\b(?:apply|configure|deploy|example|in practice|check|inspect|verify|validate|monitor|measure|logs?|metrics?|events?|command|rollback|rollout|readiness|capacity|backend|locking|resource requests?)\b/i.test(normalized)) {
      reasons.push('answer lacks a concrete operational detail');
    }

    return { valid: reasons.length === 0, reasons };
  }
}
