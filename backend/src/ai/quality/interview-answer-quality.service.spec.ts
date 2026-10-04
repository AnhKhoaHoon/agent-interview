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

  it('reports presentation issues without discarding an otherwise usable answer', () => {
    const answer = 'Certainly, Kubernetes HPA adjusts pod replicas from observed resource or custom metrics. It matters because it keeps applications responsive as demand changes while avoiding unnecessary capacity. I would set realistic resource requests, confirm metrics are available, monitor readiness and saturation, and validate that scaling improves latency without exhausting cluster capacity during a controlled workload increase. I would also inspect the HPA events and compare observed utilization with the configured target before changing limits.';

    expect(service.evaluate(answer, classification, new InterviewAnswerPlannerService().plan(classification))).toEqual(expect.objectContaining({
      valid: true,
      warnings: expect.arrayContaining(['answer starts with a generic assistant greeting'])
    }));
  });

  it('reports Markdown as a presentation warning instead of failing a streamed answer', () => {
    const answer = '- Kubernetes HPA adjusts pod replicas from observed resource or custom metrics. It matters because it keeps applications responsive as demand changes while avoiding unnecessary capacity. In practice, configure realistic resource requests, verify metrics are available, monitor readiness and saturation, and validate scaling against latency and cluster capacity during a controlled workload increase. I would inspect HPA events and observed utilization before changing a target or resource request.';

    expect(service.evaluate(answer, classification, new InterviewAnswerPlannerService().plan(classification))).toEqual(expect.objectContaining({
      valid: true,
      warnings: expect.arrayContaining(['answer uses formatting that is unsuitable for a spoken answer'])
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
