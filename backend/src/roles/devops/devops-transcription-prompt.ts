const DEVOPS_TERMS = [
  'Docker', 'Kubernetes', 'Pod', 'Deployment', 'StatefulSet', 'DaemonSet',
  'Service', 'Ingress', 'Helm', 'Kustomize', 'Terraform', 'Ansible', 'AWS',
  'EC2', 'EKS', 'ECS', 'IAM', 'VPC', 'S3', 'RDS', 'CloudWatch',
  'GitHub Actions', 'GitLab CI', 'Jenkins', 'Argo CD', 'CI/CD', 'GitOps',
  'Linux', 'Nginx', 'Prometheus', 'Grafana', 'Loki', 'ELK', 'OpenTelemetry',
  'DNS', 'TCP', 'HTTP', 'HTTPS', 'TLS', 'VPN', 'Load Balancer', 'Redis',
  'PostgreSQL', 'MySQL', 'Kafka', 'RabbitMQ', 'API', 'YAML', 'JSON', 'Bash',
  'SSH', 'RBAC', 'OAuth'
].join(', ');

/** Domain context for the only V1 role; it guides spelling, not audio content. */
export function devopsTranscriptionPrompt(language: 'vi' | 'en'): string {
  if (language === 'vi') {
    return `Đây là một cuộc phỏng vấn DevOps bằng tiếng Việt. Giữ nguyên chính tả các thuật ngữ kỹ thuật tiếng Anh khi chúng được nói trong câu: ${DEVOPS_TERMS}.`;
  }
  return `This is an English DevOps technical interview. Preserve the spelling of technical terms when spoken: ${DEVOPS_TERMS}.`;
}
