import { Injectable } from '@nestjs/common';
import { Classification, InterviewAnswerPlan } from '../contracts';
import { AnswerValidatorService, ValidationResult } from '../validator/answer-validator.service';

@Injectable()
export class InterviewAnswerQualityService {
  constructor(private readonly validator: AnswerValidatorService) {}

  evaluate(answer: string, classification: Classification, plan: InterviewAnswerPlan): ValidationResult {
    const result = this.validator.validate(answer, classification, plan.minWords, plan.maxWords);
    const normalized = answer.trim();
    const reasons = [...result.reasons];
    const warnings: string[] = [...(result.warnings ?? [])];

    if (/^(?:certainly|sure|of course|great question)[,!\s]/i.test(normalized)) {
      warnings.push('answer starts with a generic assistant greeting');
    }
    if (/^#{1,6}\s|^[-*]\s/m.test(normalized)) {
      warnings.push('answer uses formatting that is unsuitable for a spoken answer');
    }
    if (plan.responseMode === 'clarification' && (!normalized.endsWith('?') || /[?].+[?]/.test(normalized))) {
      reasons.push('clarification must be one targeted question');
    }
    if (plan.requiresOperationalDetail && !/(?:\bapply\b|\bconfigure\b|\bdeploy\b|\bexample\b|in practice|\bcheck\b|\binspect\b|\bverify\b|\bvalidate\b|\bmonitor\b|\bmeasure\b|\bmaintain\b|\bagents?\b|\bplugins?\b|\blogs?\b|\bmetrics?\b|\bevents?\b|\bcommand\b|\brollback\b|\brollout\b|\breadiness\b|\bcapacity\b|\bbackend\b|\bblocking\b|resource requests?|ví dụ|thực tế|vận hành|triển khai|cấu hình|kiểm tra|xác minh|theo dõi|giám sát|nhật ký|quay lui|khôi phục)/iu.test(normalized)) {
      // This is a quality signal, not a reason to hide an otherwise useful
      // streamed answer from an interviewer.
      warnings.push('answer could use a more concrete operational detail');
    }

    return {
      valid: reasons.length === 0,
      reasons,
      ...(warnings.length ? { warnings } : {})
    };
  }
}
