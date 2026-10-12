import { PromptBuilderService, routineModelForQuestionType, routineResponseControlsFromEnvironment } from './prompt-builder.service';
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
    expect(prompt.instructions).toContain('Do not use Markdown headings, bullets, or numbered lists');
    expect(prompt.instructions).toContain('Follow the explicit Answer language');
    expect(prompt.instructions).toContain('Answer the exact current question in the first sentence');
    expect(prompt.instructions).toContain('Definition focus: define only the named concept');
    expect(prompt.input).toContain('Answer language: match the current interviewer question exactly');
    expect(prompt.input).toContain('Previous question');
    expect(prompt.input).toContain('What is Terraform state?');
    expect(prompt.input).toContain('Prompt version: devops-interview-answer-v3');
    expect(prompt.input).toContain('Answer flow:');
    expect(prompt.input).toContain('define the named concept in plain spoken language');
    expect(prompt.input).toContain('no unsolicited workflow, example, or checklist');
    expect(prompt.input).toContain('Word range: 18-55');
  });

  it('adds precise Docker terminology guidance without turning the answer into a checklist', () => {
    const classification = {
      role: 'devops' as const, category: 'docker', type: 'definition' as const,
      level: 'middle' as const, intent: 'What is Docker?', responseMode: 'technical_definition' as const
    };
    const prompt = new PromptBuilderService().build({
      question: 'Docker là gì?', classification, history: [], plan: planner.plan(classification), answerLanguage: 'vi'
    });

    expect(prompt.instructions).toContain('distinguish an image');
    expect(prompt.instructions).toContain('Image tags are mutable references');
    expect(prompt.instructions).toContain('do not introduce CI/CD, registries, Kubernetes');
  });

  it('keeps Azure identity examples precise and Azure-specific', () => {
    const classification = {
      role: 'devops' as const, category: 'azure', type: 'definition' as const,
      level: 'middle' as const, intent: 'What is AKS workload identity?', responseMode: 'technical_definition' as const
    };
    const prompt = new PromptBuilderService().build({
      question: 'What is AKS workload identity?', classification, history: [], plan: planner.plan(classification), answerLanguage: 'en'
    });

    expect(prompt.instructions).toContain('Microsoft Entra identity/authentication');
    expect(prompt.instructions).toContain('Azure RBAC authorization');
    expect(prompt.instructions).toContain('pipeline ARM workload-identity-federated service connection');
    expect(prompt.instructions).toContain('immutable image digest');
    expect(prompt.instructions).toContain('do not substitute AWS service names');
  });

  it('adds production trade-off guidance only for a senior Azure applied question', () => {
    const classification = {
      role: 'devops' as const, category: 'azure', type: 'architecture' as const,
      level: 'senior' as const, intent: 'Design a production AKS platform', responseMode: 'technical_architecture' as const
    };
    const prompt = new PromptBuilderService().build({
      question: 'How would you design a production AKS platform?', classification, history: [], plan: planner.plan(classification), answerLanguage: 'en'
    });

    expect(prompt.instructions).toContain('availability/RTO/RPO');
    expect(prompt.instructions).toContain('Architecture focus: begin from the stated requirement');
    expect(prompt.instructions).toContain('backup is not high availability');
    expect(prompt.instructions).toContain('Do not claim active-active, zero data loss, or zero downtime');
    expect(prompt.instructions).toContain('State blast radius, choose a reversible mitigation');
  });

  it.each([
    ['gcp', 'How would you alert on a GKE service SLO?', 'IAM authorization, VPC/network reachability', 'user-visible SLI'],
    ['microservices', 'How would you handle duplicate order events?', 'at-least-once delivery', 'idempotency'],
    ['devsecops', 'How would you secure the software supply chain?', 'passed scanner is not proof', 'short-lived, scoped workload identity']
  ])('adds precise %s guardrails', (category, question, firstExpected, secondExpected) => {
    const classification = {
      role: 'devops' as const, category, type: 'scenario' as const,
      level: 'senior' as const, intent: question, responseMode: 'technical_scenario' as const
    };
    const prompt = new PromptBuilderService().build({
      question, classification, history: [], plan: planner.plan(classification), answerLanguage: 'en'
    });

    expect(prompt.instructions).toContain(firstExpected);
    expect(prompt.instructions).toContain(secondExpected);
  });

  it('grounds a response only with retrieved knowledge and never exposes retrieval to the candidate', () => {
    const classification = {
      role: 'devops' as const, category: 'docker', type: 'definition' as const,
      level: 'middle' as const, intent: 'What is Docker?', responseMode: 'technical_definition' as const
    };
    const prompt = new PromptBuilderService().build({
      question: 'Docker là gì?', classification, history: [], plan: planner.plan(classification),
      knowledge: [{ sourcePath: 'devops/docker/README.md', category: 'docker', score: 0.9, text: 'An image is layered; a container is a running instance.' }]
    });

    expect(prompt.input).toContain('Retrieved knowledge: Use this only when it directly supports');
    expect(prompt.input).toContain('An image is layered; a container is a running instance.');
    expect(prompt.input).toContain('Do not mention documents, sources, retrieval, or citations');
  });

  it('uses the selected answer language instead of guessing from the transcript', () => {
    const classification = {
      role: 'devops' as const, category: 'kubernetes', type: 'definition' as const,
      level: 'middle' as const, intent: 'HPA', responseMode: 'technical_definition' as const
    };
    const prompt = new PromptBuilderService().build({
      question: 'Kubernetes HPA là gì?', classification, history: [], plan: planner.plan(classification), answerLanguage: 'en'
    });

    expect(prompt.input).toContain('Answer language: English.');
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
    expect(prompt.instructions).toContain('Comparison focus: compare only the named options');
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

  it('uses CV facts and a job description as bounded data without authorizing invented experience', () => {
    const classification = {
      role: 'devops' as const, category: 'kubernetes', type: 'experience' as const,
      level: 'middle' as const, intent: 'Experience with Kubernetes', responseMode: 'behavioral_experience' as const
    };
    const prompt = new PromptBuilderService().build({
      question: 'Tell me about your Kubernetes experience.', classification, history: [], plan: planner.plan(classification),
      candidateProfile: 'Built deployment automation with Kubernetes and Terraform.',
      jobDescription: 'Requires Kubernetes, AWS, and incident response.'
    });

    expect(prompt.input).toContain('Use only explicit, verified facts from this profile');
    expect(prompt.input).toContain('Built deployment automation with Kubernetes and Terraform.');
    expect(prompt.input).toContain('Do not claim the candidate has a requirement unless the candidate profile explicitly supports it');
    expect(prompt.input).toContain('Requires Kubernetes, AWS, and incident response.');
  });

  it('uses DBA instructions and database recovery guardrails for a DBA session', () => {
    const classification = {
      role: 'dba' as const, category: 'backup-recovery', type: 'scenario' as const,
      level: 'senior' as const, intent: 'How would you test a PITR recovery?', responseMode: 'technical_scenario' as const
    };
    const prompt = new PromptBuilderService().build({
      question: 'How would you test a PITR recovery?', classification, history: [], plan: planner.plan(classification), answerLanguage: 'en'
    });

    expect(prompt.input).toContain('Prompt version: dba-interview-answer-v1');
    expect(prompt.input).toContain('Interview role: DBA');
    expect(prompt.instructions).toContain('Database Administrator interview');
    expect(prompt.instructions).toContain('backup from a tested recovery procedure');
    expect(prompt.instructions).not.toContain('Docker accuracy');
  });

  it('routes only routine, well-scoped question types to an explicitly configured fast model', () => {
    const environment = { LLM_ROUTINE_MODEL: 'gpt-5-mini' } as NodeJS.ProcessEnv;

    expect(routineModelForQuestionType('definition', environment)).toBe('gpt-5-mini');
    expect(routineModelForQuestionType('comparison', environment)).toBe('gpt-5-mini');
    expect(routineModelForQuestionType('command', environment)).toBe('gpt-5-mini');
    expect(routineModelForQuestionType('scenario', environment)).toBeUndefined();
    expect(routineModelForQuestionType('architecture', environment)).toBeUndefined();
  });

  it('reads bounded response controls for the fast routine path', () => {
    expect(routineResponseControlsFromEnvironment({
      LLM_ROUTINE_REASONING_EFFORT: 'minimal',
      LLM_ROUTINE_MAX_OUTPUT_TOKENS: '300',
      LLM_ROUTINE_VERBOSITY: 'low'
    } as NodeJS.ProcessEnv)).toEqual({ reasoningEffort: 'minimal', maxOutputTokens: 300, verbosity: 'low' });
  });
});
