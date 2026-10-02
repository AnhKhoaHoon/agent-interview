import { InterviewAnswerPlannerService } from '../planner/interview-answer-planner.service';
import { AnswerValidatorService } from '../validator/answer-validator.service';
import { InterviewAnswerQualityService } from './interview-answer-quality.service';

describe('InterviewAnswerQualityService', () => {
  const service = new InterviewAnswerQualityService(new AnswerValidatorService());
  const classification = {
    role: 'devops' as const,
    category: 'kubernetes',
    type: 'definition' as const,
    level: 'middle' as const,
    intent: 'What is HPA?',
    responseMode: 'technical_definition' as const
  };

  it('rejects generic assistant greetings before an otherwise valid answer', () => {
    const answer = 'Certainly, Kubernetes HPA adjusts pod replicas from observed resource or custom metrics. It matters because it keeps applications responsive as demand changes while avoiding unnecessary capacity. I would set realistic resource requests, confirm metrics are available, monitor readiness and saturation, and validate that scaling improves latency without exhausting cluster capacity during a controlled workload increase.';

    expect(service.evaluate(answer, classification, new InterviewAnswerPlannerService().plan(classification))).toEqual(expect.objectContaining({
      valid: false,
      reasons: expect.arrayContaining(['answer starts with a generic assistant greeting'])
    }));
  });

  it('rejects a technical answer that remains purely theoretical', () => {
    const answer = 'Kubernetes HPA is a control mechanism based on desired state and observed utilization. Its conceptual purpose is elasticity, which means the number of replicas can change as demand changes. It belongs to the broader orchestration model where declarative resources describe intent and controllers reconcile actual state toward that intent over time across a distributed computing environment.';

    expect(service.evaluate(answer, classification, new InterviewAnswerPlannerService().plan(classification))).toEqual(expect.objectContaining({
      valid: false,
      reasons: expect.arrayContaining(['answer lacks a concrete operational detail'])
    }));
  });
});
