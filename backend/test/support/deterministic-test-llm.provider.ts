import { LlmGenerationInput, LlmProvider } from '../../src/ai/contracts';

export class DeterministicTestLlmProvider implements LlmProvider {
  readonly name = 'deterministic-test-double';

  async *stream(input: LlmGenerationInput): AsyncIterable<string> {
    for (const token of this.answerFor(input.input).split(/(\s+)/).filter(Boolean)) yield token;
  }

  private answerFor(input: string): string {
    if (/ask one targeted clarifying question/i.test(input)) {
      return 'Could you clarify which DevOps tool, symptom, or scenario you want me to address?';
    }
    if (/tell me about|describe a time|have you|experience/i.test(input)) {
      return 'Adaptable answer: Situation: [name a relevant service or project]. Task: [state the reliability, deployment, or incident goal]. Action: explain the specific checks, automation, and collaboration you used, with one technical detail. Result: [replace with a verified outcome or lesson]. I would keep the example honest, focus on what I personally contributed, and close with how I verified the improvement. Before using it, replace every placeholder with facts from your real background.';
    }
    if (/Question type: definition/i.test(input) && /ci\/cd/i.test(input)) {
      return 'CI/CD automates building, testing, and releasing software changes. Continuous Integration validates each change early, while Continuous Delivery prepares a release and Continuous Deployment releases it automatically.';
    }
    if (/Question type: definition/i.test(input) && /hpa|horizontal pod autoscaler/i.test(input)) {
      return 'Kubernetes HPA automatically adjusts pod replica count from observed CPU, memory, or custom metrics. It helps a workload remain responsive as demand changes.';
    }
    if (/Question type: definition/i.test(input) && /terraform/i.test(input)) {
      return 'Terraform state records the infrastructure resources Terraform manages and maps them to configuration. Terraform uses it to calculate which resources it can safely create, change, or destroy.';
    }
    if (/Question type: definition/i.test(input)) {
      return 'A DevOps concept should be defined by its core purpose and boundary. The important distinction is how that specific mechanism changes the system it belongs to.';
    }
    if (/Question type: comparison/i.test(input) && /terraform/i.test(input)) {
      return 'Terraform is cloud-agnostic infrastructure as code with provider-based state, while CloudFormation is AWS-native and follows AWS resource support closely. In practice, I choose Terraform for multi-account or multi-cloud standardization and reusable modules, but I must operate remote state and locking safely. I choose CloudFormation when the platform is AWS-only and native integration matters more. I validate either choice through reviewed plans, automated checks, controlled deployment, and rollback procedures.';
    }
    if (/Question type: architecture/i.test(input) && /aws/i.test(input)) {
      return 'I would design the AWS platform across at least two Availability Zones behind a load balancer, with stateless services scaling horizontally and data using a managed Multi-AZ store. In practice, infrastructure is versioned with Terraform, access follows least privilege, and deployments use health checks plus gradual rollout. I would monitor latency, errors, saturation, and failover behavior, then test recovery regularly. The main trade-off is higher resilience versus additional cost and operational complexity.';
    }
    if (/Question type: command/i.test(input) && /kubectl/i.test(input)) {
      return 'I would start with `kubectl describe pod <pod> -n <namespace>` to inspect events, probe failures, scheduling decisions, and container state. Then I would use `kubectl logs <pod> -n <namespace> --previous` when the container has restarted. These checks separate platform configuration problems from application crashes without changing the workload. After isolating the cause, I would apply the smallest safe fix and verify readiness, restart count, events, logs, and service error metrics.';
    }
    if (/crashloop|troubleshoot|error|failed/i.test(input)) {
      return 'I would start with the pod status, recent events, and container logs, including the previous container log if it restarted. Then I would verify the command, environment variables, mounted secrets, probes, and resource limits. Common causes are a bad startup configuration, an application crash, or an OOM kill. After fixing the root cause, I would redeploy and confirm the pod stays ready and error metrics return to normal.';
    }
    return 'I would give a direct definition first, then explain the operational impact and one practical check. For a DevOps system, I focus on automation, observability, security, and a safe rollout path. I would validate the change with logs and metrics, monitor the result after deployment, and keep a rollback option so the service remains reliable if the assumption is wrong.';
  }
}
