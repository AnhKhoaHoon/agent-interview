import { InterviewAnswerPlannerService } from './interview-answer-planner.service';

describe('InterviewAnswerPlannerService', () => {
  const service = new InterviewAnswerPlannerService();

  it('uses a troubleshooting plan with an ordered, verifiable answer shape', () => {
    const plan = service.plan({
      role: 'devops', category: 'kubernetes', type: 'troubleshooting', level: 'middle', intent: 'CrashLoopBackOff', responseMode: 'technical_troubleshooting'
    });

    expect(plan).toMatchObject({ promptVersion: 'devops-interview-answer-v2', maxWords: 120, requiresOperationalDetail: true });
    expect(plan.requiredPoints).toEqual(expect.arrayContaining(['likely causes', 'ordered checks', 'remediation', 'verification']));
    expect(plan.deliverySteps).toEqual(expect.arrayContaining([
      'give ordered commands, logs, metrics, or configuration checks',
      'fix the isolated cause and verify recovery'
    ]));
  });

  it('uses a concise targeted question plan for incomplete input', () => {
    const plan = service.plan({
      role: 'devops', category: 'general', type: 'definition', level: 'middle', intent: 'Clarify', responseMode: 'clarification'
    });

    expect(plan).toMatchObject({ maxWords: 30, opening: 'Ask one targeted clarifying question.', requiresOperationalDetail: false });
  });
});
