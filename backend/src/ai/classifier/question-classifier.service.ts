import { Injectable } from '@nestjs/common';
import { Classification, QuestionType, ResponseMode } from '../contracts';
import { InterviewRole } from '../../roles/interview-role';

const DEVOPS_CATEGORY_MATCHERS: Array<[string, RegExp]> = [
  ['docker-compose', /\b(docker[ -]?compose|compose\.ya?ml)\b/i],
  ['azure', /\b(azure|aks|bicep|azure devops|azure pipelines?|azure repos|azure artifacts|microsoft entra|entra id|key vault|azure container registry|acr|app service|azure functions|azure monitor|log analytics|workload identity federation)\b/i],
  ['gcp', /\b(gcp|google cloud|gke|cloud run|cloud build|artifact registry|cloud monitoring|cloud logging|cloud trace|cloud sql|pub\/?sub|bigquery|workload identity)\b/i],
  ['devsecops', /\b(devsecops|slsa|sbom|sast|dast|software composition analysis|\bsca\b|secret scanning|policy as code|software supply chain|supply chain security)\b/i],
  ['microservices', /\b(microservices?|service mesh|api gateway|distributed system|saga pattern|outbox pattern)\b/i],
  ['kubernetes', /\b(kubernetes|k8s|pod|deployment|helm|hpa|ingress|crashloopbackoff)\b/i],
  ['iac', /\b(infrastructure as code|iac|cloudformation|pulumi)\b/i],
  ['terraform', /\b(terraform|tfstate|state file|iac)\b/i],
  ['docker', /\b(docker|container|image|dockerfile)\b/i],
  ['aws', /\b(aws|ec2|s3|vpc|lambda|eks|rds)\b/i],
  ['jenkins', /\bjenkins\b/i],
  ['gitlab-ci', /\b(gitlab(?: ci)?|\.gitlab-ci\.ya?ml)\b/i],
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

const DBA_CATEGORY_MATCHERS: Array<[string, RegExp]> = [
  ['db2-luw', /\b(db2(?:\s+luw)?|ibm db2|db2pd|db2diag|hadr|purescale|dpf|database partition(?:ing|ed)|federation|sql\s*pl)\b/i],
  ['postgresql', /\b(postgresql|postgres|pg_stat|pg_dump|pg_restore|wal|vacuum|autovacuum|pitr)\b/i],
  ['mysql', /\b(mysql|mariadb|innodb|binlog|gtid)\b/i],
  ['sql-server', /\b(sql server|mssql|always on|availability group|query store|t-?sql)\b/i],
  ['oracle', /\b(oracle|rman|data guard|redo log)\b/i],
  ['backup-recovery', /\b(backup|restore|recovery|point[ -]?in[ -]?time|pitr|rpo|rto)\b|sao\s+lưu|phục\s+hồi/iu],
  ['replication-ha', /\b(replication|replica|failover|high availability|read replica|replication lag)\b|nhân\s+bản|chuyển\s+đổi\s+dịch\s+vụ/iu],
  ['performance', /\b(query plan|explain|index(?:es)?|slow query|performance|latency|connection pool|lock(?:ing)?|deadlock)\b|hiệu\s+năng|tối\s+ưu|truy\s+vấn\s+chậm|khóa/iu],
  ['database-security', /\b(database security|encryption|audit|least privilege|database role|privilege|sql injection|row level security)\b|phân\s+quyền|mã\s+hóa|kiểm\s+toán/iu],
  ['troubleshooting', /\b(error|failed|failure|not working|debug|troubleshoot|incident|outage)\b|lỗi|sự\s+cố|không\s+hoạt\s+động/iu],
  ['general', /\b(database|dba|sql|transaction|acid|isolation|schema|migration)\b|cơ\s+sở\s+dữ\s+liệu|giao\s+dịch/iu]
];

@Injectable()
export class QuestionClassifierService {
  classify(question: string, role: InterviewRole = 'devops'): Classification {
    const type = this.detectType(question);
    const category = this.detectCategory(question, type, role);
    return {
      role,
      category,
      type,
      level: this.detectLevel(question),
      intent: question.trim(),
      responseMode: this.responseModeFor(type)
    };
  }

  private detectType(question: string): QuestionType {
    if (/(?:\bcompare\b|\bdifference\b|\bvs\.?\b|\bversus\b|sự\s+khác\s+biệt|khác\s+nhau|so\s+sánh|phân\s+biệt|(?:việc|vấn\s+đề)\s+giữa)/iu.test(question)) return 'comparison';
    if (/\b(error|failed|failure|not working|crashloop|debug|troubleshoot|incident)\b/i.test(question)) return 'troubleshooting';
    if (/(?:\b(write|implement|code)\b.{0,48}\b(?:sql|query|select|procedure)\b|\b(?:sql|query)\b.{0,32}\b(?:for|to|that)\b|viết\s+(?:câu\s+)?(?:sql|query|truy\s+vấn)|code\s+(?:sql|query))/iu.test(question)) return 'command';
    if (/\b(design|architecture|architect)\b/i.test(question)) return 'architecture';
    if (/\b(command|cli|kubectl|psql|mysql|sqlcmd|rman|how would you check)\b/i.test(question)) return 'command';
    if (/\b(tell me about|experience|have you|describe a time)\b/i.test(question)) return 'experience';
    if (/\b(what would you|how would you|scenario)\b/i.test(question)) return 'scenario';
    if (/\b(best practice|best-practice)\b/i.test(question)) return 'best-practice';
    return 'definition';
  }

  private detectCategory(question: string, type: QuestionType, role: InterviewRole): string {
    // GitLab and Jenkins in one short question is an interview comparison of
    // CI/CD tools, even if STT drops words such as "sự khác biệt".
    if (role === 'devops' && type === 'comparison' && /\bgitlab\b/i.test(question) && /\bjenkins\b/i.test(question)) return 'cicd';
    const matchers = role === 'dba' ? DBA_CATEGORY_MATCHERS : DEVOPS_CATEGORY_MATCHERS;
    return matchers.find(([, matcher]) => matcher.test(question))?.[0]
      ?? (type === 'troubleshooting' ? 'troubleshooting' : 'general');
  }

  private detectLevel(question: string): Classification['level'] {
    if (/\b(senior|staff|principal|production|prod|enterprise|high availability|multi[ -]region|slo|rto|rpo|at scale)\b|sản\s+xuất|thực\s+tế|quy\s+mô\s+lớn/iu.test(question)) return 'senior';
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
