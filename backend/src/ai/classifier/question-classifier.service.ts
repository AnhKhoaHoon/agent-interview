import { Injectable } from '@nestjs/common';
import { Classification, QuestionType, ResponseMode } from '../contracts';

const CATEGORY_MATCHERS: Array<[string, RegExp]> = [
  ['docker-compose', /\b(docker[ -]?compose|compose\.ya?ml)\b/i],
  ['kubernetes', /\b(kubernetes|k8s|pod|deployment|helm|hpa|ingress|crashloopbackoff)\b/i],
  ['terraform', /\b(terraform|tfstate|state file|iac)\b/i],
  ['docker', /\b(docker|container|image|dockerfile)\b/i],
  ['aws', /\b(aws|ec2|s3|vpc|lambda|eks|rds)\b/i],
  ['jenkins', /\bjenkins\b/i],
  ['gitlab-ci', /\b(gitlab ci|\.gitlab-ci\.ya?ml)\b/i],
  ['argocd', /\b(argo ?cd|argocd)\b/i],
  ['cicd', /\b(ci\/cd|pipeline|github actions)\b/i],
  ['prometheus', /\bprometheus\b/i],
  ['grafana', /\bgrafana\b/i],
  ['logging', /\b(logging|log aggregation|elk|opensearch)\b/i],
  ['observability', /\b(metrics|tracing|observability|alert)\b/i],
  ['networking', /\b(dns|tcp|udp|http|load balanc|network|subnet)\b/i],
  ['security', /\b(security|secret|iam|certificate|tls|rbac|vulnerability)\b/i],
  ['ansible', /\b(ansible|playbook|inventory)\b/i],
  ['redis', /\bredis\b/i],
  ['kafka', /\bkafka\b/i],
  ['postgresql', /\b(postgresql|postgres)\b/i],
  ['mysql', /\bmysql\b/i],
  ['git', /\b(git|rebase|merge|branch)\b/i],
  ['linux', /\b(linux|systemd|process|memory|cpu|filesystem)\b/i],
  ['system-design', /\b(system design|architecture|architect)\b/i]
];

@Injectable()
export class QuestionClassifierService {
  classify(question: string): Classification {
    const type = this.detectType(question);
    const category = CATEGORY_MATCHERS.find(([, matcher]) => matcher.test(question))?.[0] ?? (type === 'troubleshooting' ? 'troubleshooting' : 'general');
    return {
      role: 'devops',
      category,
      type,
      level: this.detectLevel(question),
      intent: question.trim(),
      responseMode: this.responseModeFor(type)
    };
  }

  private detectType(question: string): QuestionType {
    if (/\b(compare|difference|vs\.?|versus)\b/i.test(question)) return 'comparison';
    if (/\b(error|failed|failure|not working|crashloop|debug|troubleshoot|incident)\b/i.test(question)) return 'troubleshooting';
    if (/\b(design|architecture|architect)\b/i.test(question)) return 'architecture';
    if (/\b(command|cli|kubectl|how would you check)\b/i.test(question)) return 'command';
    if (/\b(tell me about|experience|have you|describe a time)\b/i.test(question)) return 'experience';
    if (/\b(what would you|how would you|scenario)\b/i.test(question)) return 'scenario';
    if (/\b(best practice|best-practice)\b/i.test(question)) return 'best-practice';
    return 'definition';
  }

  private detectLevel(question: string): Classification['level'] {
    if (/\b(senior|staff|principal)\b/i.test(question)) return 'senior';
    if (/\b(junior|entry)\b/i.test(question)) return 'junior';
    return 'middle';
  }

  private responseModeFor(type: QuestionType): ResponseMode {
    const modes: Record<QuestionType, ResponseMode> = {
      definition: 'technical_definition',
      comparison: 'technical_comparison',
      troubleshooting: 'technical_troubleshooting',
      scenario: 'technical_scenario',
      architecture: 'technical_architecture',
      command: 'technical_command',
      experience: 'behavioral_experience',
      'best-practice': 'technical_scenario'
    };
    return modes[type];
  }
}
