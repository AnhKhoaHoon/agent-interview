import { AnswerValidatorService } from './answer-validator.service';

describe('AnswerValidatorService', () => {
  const classification = {
    role: 'devops' as const,
    category: 'general',
    type: 'experience' as const,
    level: 'middle' as const,
    intent: 'Tell me about your experience',
    responseMode: 'behavioral_experience' as const
  };

  it('rejects unverified first-person experience claims', () => {
    const result = new AnswerValidatorService().validate(
      'I led my team at my company through a difficult production migration and delivered a successful project with excellent metrics and a clear business outcome for every stakeholder.',
      classification
    );
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('experience answer contains unverified first-person claims');
  });
});
