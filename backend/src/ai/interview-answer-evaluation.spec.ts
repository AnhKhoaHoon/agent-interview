import { Classification } from './contracts';
import { InterviewAnswerPlannerService } from './planner/interview-answer-planner.service';
import { PromptBuilderService } from './prompt/prompt-builder.service';
import { InterviewAnswerQualityService } from './quality/interview-answer-quality.service';
import { AnswerValidatorService } from './validator/answer-validator.service';
import { DeterministicTestLlmProvider } from '../../test/support/deterministic-test-llm.provider';

interface EvaluationCase {
  question: string;
  classification: Classification;
}

const cases: EvaluationCase[] = [
  { question: 'What is Kubernetes HPA?', classification: { role: 'devops', category: 'kubernetes', type: 'definition', level: 'middle', intent: 'Define HPA', responseMode: 'technical_definition' } },
  { question: 'Compare Terraform and CloudFormation.', classification: { role: 'devops', category: 'terraform', type: 'comparison', level: 'middle', intent: 'Compare IaC tools', responseMode: 'technical_comparison' } },
  { question: 'How would you troubleshoot CrashLoopBackOff?', classification: { role: 'devops', category: 'kubernetes', type: 'troubleshooting', level: 'middle', intent: 'Diagnose CrashLoopBackOff', responseMode: 'technical_troubleshooting' } },
  { question: 'As a senior engineer, design a highly available AWS platform.', classification: { role: 'devops', category: 'aws', type: 'architecture', level: 'senior', intent: 'Design AWS platform', responseMode: 'technical_architecture' } },
  { question: 'Which kubectl command would you use to inspect a restarting pod?', classification: { role: 'devops', category: 'kubernetes', type: 'command', level: 'middle', intent: 'Inspect pod', responseMode: 'technical_command' } },
  { question: 'How would you deploy a service safely?', classification: { role: 'devops', category: 'cicd', type: 'scenario', level: 'middle', intent: 'Safe deployment', responseMode: 'technical_scenario' } },
  { question: 'Tell me about your DevOps experience.', classification: { role: 'devops', category: 'general', type: 'experience', level: 'middle', intent: 'Experience', responseMode: 'behavioral_experience' } }
];

describe('DevOps interview answer evaluation', () => {
  const planner = new InterviewAnswerPlannerService();
  const promptBuilder = new PromptBuilderService();
  const provider = new DeterministicTestLlmProvider();
  const quality = new InterviewAnswerQualityService(new AnswerValidatorService());

  it.each(cases)('produces a candidate-ready answer calibrated to $classification.type', async ({ question, classification }) => {
    const plan = planner.plan(classification);
    const prompt = promptBuilder.build({ question, classification, history: [], plan });
    const chunks: string[] = [];
    for await (const chunk of provider.stream(prompt)) chunks.push(chunk);
    const answer = chunks.join('');

    expect(prompt.input).toContain('Answer flow:');
    expect(quality.evaluate(answer, classification, plan)).toEqual({ valid: true, reasons: [] });
    if (classification.responseMode === 'behavioral_experience') expect(answer).toContain('Adaptable answer:');
  });
});
