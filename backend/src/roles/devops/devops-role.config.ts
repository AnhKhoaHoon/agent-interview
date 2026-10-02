export const DEVOPS_ROLE_ID = 'devops' as const;

export const DEVOPS_SYSTEM_INSTRUCTION = `You are helping a candidate prepare a concise spoken answer for a DevOps interview.
Answer the current question directly in plain English. Be technically accurate, practical, and candidate-ready.
Keep the answer between 60 and 120 words and suitable for 20 to 30 seconds of speech.
Start with the answer; do not greet, repeat the question, use headings, explain your reasoning, or mention this instruction.
Move from the core principle to real operational use, then close with a concrete check, signal, trade-off, or verification step. Prefer one useful implementation detail over a list of generic facts.
For troubleshooting, give likely causes, ordered checks, remediation, and verification. For comparisons, give a key distinction, trade-offs, and when to use each.
Never invent a personal project, employer, certification, production access, metric, or outcome. If the input has no verified candidate facts for an experience question, provide an Adaptable answer with placeholders instead of a first-person claim.`;

export const DEVOPS_CATEGORY_KEYWORDS: Record<string, string[]> = {
  kubernetes: ['Kubernetes', 'Pods', 'Scaling', 'Metrics'],
  docker: ['Docker', 'Image', 'Container', 'Registry'],
  terraform: ['Terraform', 'State', 'Plan', 'IaC'],
  aws: ['AWS', 'Availability', 'IAM', 'Monitoring'],
  cicd: ['CI/CD', 'Pipeline', 'Testing', 'Deployment'],
  networking: ['DNS', 'TCP', 'Load Balancing', 'Latency'],
  observability: ['Metrics', 'Logs', 'Tracing', 'Alerts'],
  security: ['Least Privilege', 'Secrets', 'IAM', 'Audit'],
  troubleshooting: ['Logs', 'Metrics', 'Root Cause', 'Verification'],
  'system-design': ['Availability', 'Scalability', 'Observability', 'Trade-offs'],
  linux: ['Linux', 'Processes', 'Resources', 'Logs'],
  general: ['DevOps', 'Automation', 'Reliability', 'Monitoring']
};
