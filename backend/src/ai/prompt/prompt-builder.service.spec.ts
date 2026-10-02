import { PromptBuilderService } from './prompt-builder.service';
import { InterviewAnswerPlannerService } from '../planner/interview-answer-planner.service';

describe('PromptBuilderService', () => {
  const planner = new InterviewAnswerPlannerService();

  it('includes the selected interview mode and bounded context', () => {
    const classification = {
      role: 'devops' as const,
      category: 'terraform',
      type: 'definition' as const,
      level: 'middle' as const,
      intent: 'What is Terraform state?',
      responseMode: 'technical_definition' as const
    };
    const prompt = new PromptBuilderService().build({
      question: 'What is Terraform state?',
      classification,
      history: [{ role: 'interviewer', content: 'Previous question' }],
      plan: planner.plan(classification)
    });

    expect(prompt.instructions).toContain('technical_definition');
    expect(prompt.input).toContain('Previous question');
    expect(prompt.input).toContain('What is Terraform state?');
    expect(prompt.input).toContain('Prompt version: devops-interview-answer-v2');
    expect(prompt.input).toContain('Theory-to-practice flow:');
    expect(prompt.input).toContain('show where it is used in a real system');
    expect(prompt.input).toContain('why it matters operationally');
  });

  it('changes the instruction for comparison and senior questions', () => {
    const classification = {
      role: 'devops' as const,
      category: 'terraform',
      type: 'comparison' as const,
      level: 'senior' as const,
      intent: 'Compare Terraform and CloudFormation.',
      responseMode: 'technical_comparison' as const
    };
    const prompt = new PromptBuilderService().build({
      question: 'Compare Terraform and CloudFormation.',
      classification,
      history: [],
      plan: planner.plan(classification)
    });

    expect(prompt.instructions).toContain('system-wide reliability, security, or cost trade-offs');
    expect(prompt.input).toContain('Question type: comparison');
    expect(prompt.input).toContain('material trade-off');
    expect(prompt.input).toContain('when to choose each option');
  });

  it('marks a follow-up and names the interviewer turn it refers to', () => {
    const classification = {
      role: 'devops' as const,
      category: 'kubernetes',
      type: 'definition' as const,
      level: 'middle' as const,
      intent: 'Follow up on the previous question: Why?',
      responseMode: 'technical_definition' as const
    };
    const prompt = new PromptBuilderService().build({
      question: 'Why?',
      classification,
      history: [
        { role: 'interviewer', content: 'What is Kubernetes HPA?' },
        { role: 'assistant', content: 'HPA scales pods from observed metrics.' }
      ],
      plan: planner.plan(classification),
      followUp: { referenceQuestion: 'What is Kubernetes HPA?' }
    });

    expect(prompt.input).toContain('Conversation relation: follow-up');
    expect(prompt.input).toContain('Referenced interviewer question: What is Kubernetes HPA?');
    expect(prompt.input).toContain('Current interviewer question: Why?');
  });
});
