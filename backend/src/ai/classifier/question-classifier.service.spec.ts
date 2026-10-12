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
    ['How would you monitor a production GKE service?', 'gcp', 'scenario', 'technical_scenario'],
    ['How would you troubleshoot a microservice dependency timeout?', 'microservices', 'troubleshooting', 'technical_troubleshooting'],
    ['How would you secure a CI/CD software supply chain?', 'devsecops', 'scenario', 'technical_scenario'],
    ['How would you troubleshoot an Azure Key Vault access failure?', 'azure', 'troubleshooting', 'technical_troubleshooting'],
    ['How would you deploy an AKS service safely with Azure Pipelines?', 'azure', 'scenario', 'technical_scenario'],
    ['How would you troubleshoot Azure Pipelines service connection failure?', 'azure', 'troubleshooting', 'technical_troubleshooting'],
    ['Which kubectl command would you use to inspect a pod?', 'kubernetes', 'command', 'technical_command'],
    ['Tell me about your DevOps experience.', 'general', 'experience', 'behavioral_experience']
  ])('classifies %s using the expected DevOps answer mode', (question, category, type, responseMode) => {
    expect(service.classify(question)).toMatchObject({ category, type, responseMode });
  });

  it.each([
    'How would you design a production AKS platform?',
    'How would you define an RTO and RPO for a multi-region Azure service?',
    'Làm sao triển khai AKS ở môi trường sản xuất quy mô lớn?'
  ])('uses senior answer depth for an explicit production question: %s', (question) => {
    expect(service.classify(question)).toMatchObject({ level: 'senior' });
  });

  it('classifies a DBA recovery question without using the DevOps taxonomy', () => {
    expect(service.classify('How would you test PostgreSQL point-in-time recovery for a production database?', 'dba')).toMatchObject({
      role: 'dba', category: 'postgresql', type: 'scenario', level: 'senior', responseMode: 'technical_scenario'
    });
  });

  it.each([
    ['How does Db2 LUW HADR work?', 'db2-luw', 'definition'],
    ['How would you migrate Db2 LUW to Amazon RDS for Db2?', 'db2-luw', 'scenario'],
    ['How do you troubleshoot Db2 pureScale lock contention?', 'db2-luw', 'troubleshooting']
  ])('classifies DB2 LUW question %s into the Db2 knowledge category', (question, category, type) => {
    expect(service.classify(question, 'dba')).toMatchObject({ role: 'dba', category, type });
  });

  it.each([
    ['Write a MySQL query to find duplicate customer emails.', 'mysql'],
    ['Viết câu SQL tìm các email bị trùng trong MySQL.', 'mysql']
  ])('treats DBA SQL coding prompt as a command: %s', (question, category) => {
    expect(service.classify(question, 'dba')).toMatchObject({ role: 'dba', category, type: 'command', responseMode: 'technical_command' });
  });
});
