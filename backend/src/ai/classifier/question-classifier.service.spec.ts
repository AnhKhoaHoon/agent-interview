import { QuestionClassifierService } from './question-classifier.service';

describe('QuestionClassifierService', () => {
  const service = new QuestionClassifierService();

  it('classifies a Kubernetes troubleshooting question into a candidate answer mode', () => {
    expect(service.classify('How would you troubleshoot CrashLoopBackOff in Kubernetes?')).toMatchObject({
      role: 'devops',
      category: 'kubernetes',
      type: 'troubleshooting',
      level: 'middle',
      responseMode: 'technical_troubleshooting'
    });
  });

  it('detects senior architecture questions', () => {
    expect(service.classify('As a senior engineer, design a highly available AWS platform')).toMatchObject({
      category: 'aws',
      type: 'architecture',
      level: 'senior',
      responseMode: 'technical_architecture'
    });
  });

  it.each([
    ['What is Terraform state?', 'terraform', 'definition', 'technical_definition'],
    ['What is Infrastructure as Code?', 'iac', 'definition', 'technical_definition'],
    ['Compare Docker Compose versus Kubernetes.', 'docker-compose', 'comparison', 'technical_comparison'],
    ['Sự khác biệt giữa GitLab và Jenkins là gì?', 'cicd', 'comparison', 'technical_comparison'],
    ['Việc giữa GitLab và Jenkins', 'cicd', 'comparison', 'technical_comparison'],
    ['When should I rebase a Git branch?', 'git', 'definition', 'technical_definition'],
    ['How would you troubleshoot a service startup failure?', 'troubleshooting', 'troubleshooting', 'technical_troubleshooting'],
    ['How would you design a senior AWS platform?', 'aws', 'architecture', 'technical_architecture'],
    ['What is AKS?', 'azure', 'definition', 'technical_definition'],
    ['How would you troubleshoot an Azure Key Vault access failure?', 'azure', 'troubleshooting', 'technical_troubleshooting'],
    ['Which kubectl command would you use to inspect a pod?', 'kubernetes', 'command', 'technical_command'],
    ['Tell me about your DevOps experience.', 'general', 'experience', 'behavioral_experience']
  ])('classifies %s using the expected DevOps answer mode', (question, category, type, responseMode) => {
    expect(service.classify(question)).toMatchObject({ category, type, responseMode });
  });
});
