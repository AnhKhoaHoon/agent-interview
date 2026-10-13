import { InterviewAnswerPlannerService } from './interview-answer-planner.service';

describe('InterviewAnswerPlannerService', () => {
  const service = new InterviewAnswerPlannerService();

  it('uses a troubleshooting plan with an ordered, verifiable answer shape', () => {
    const plan = service.plan({
      role: 'devops', category: 'kubernetes', type: 'troubleshooting', level: 'middle', intent: 'CrashLoopBackOff', responseMode: 'technical_troubleshooting'
    });

    expect(plan).toMatchObject({ promptVersion: 'devops-interview-answer-v4', minWords: 60, maxWords: 120, requiresOperationalDetail: true });
    expect(plan.requiredPoints).toEqual(expect.arrayContaining(['impact or containment', 'evidence-driven diagnosis', 'remediation', 'workload and service verification']));
    expect(plan.deliverySteps).toEqual(expect.arrayContaining([
      'give ordered, high-signal checks and say what each log, event, metric, or configuration check establishes',
      'apply the smallest reversible fix only after evidence supports a cause; use rollback only when the release correlation is clear'
    ]));
  });

  it('uses a concise targeted question plan for incomplete input', () => {
    const plan = service.plan({
      role: 'devops', category: 'general', type: 'definition', level: 'middle', intent: 'Clarify', responseMode: 'clarification'
    });

    expect(plan).toMatchObject({ minWords: 1, maxWords: 30, opening: 'Ask one targeted clarifying question.', requiresOperationalDetail: false });
  });

  it('keeps a direct definition short and does not force operational detail', () => {
    const plan = service.plan({
      role: 'devops', category: 'docker', type: 'definition', level: 'middle', intent: 'What is Docker?', responseMode: 'technical_definition'
    });

    expect(plan).toMatchObject({ minWords: 18, maxWords: 55, requiresOperationalDetail: false });
    expect(plan.qualityChecks).toContain('no unsolicited workflow, example, or checklist');
  });
});
