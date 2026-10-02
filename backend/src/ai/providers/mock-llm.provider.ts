import { Injectable } from '@nestjs/common';
import { LlmGenerationInput, LlmProvider } from '../contracts';

@Injectable()
export class MockLlmProvider implements LlmProvider {
  readonly name = 'mock';

  async *stream(input: LlmGenerationInput): AsyncIterable<string> {
    const answer = this.answerFor(input.input);
    for (const token of answer.split(/(\s+)/).filter(Boolean)) {
      yield token;
    }
  }

  private answerFor(input: string): string {
    if (/ask one targeted clarifying question/i.test(input)) {
      return 'Could you clarify which DevOps tool, symptom, or scenario you want me to address?';
    }
    if (/tell me about|describe a time|have you|experience/i.test(input)) {
      return 'Adaptable answer: Situation: [name a relevant service or project]. Task: [state the reliability, deployment, or incident goal]. Action: explain the specific checks, automation, and collaboration you used, with one technical detail. Result: [replace with a verified outcome or lesson]. I would keep the example honest, focus on what I personally contributed, and close with how I verified the improvement. Before using it, replace every placeholder with facts from your real background.';
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
    if (/hpa|horizontal pod autoscaler/i.test(input)) {
      return 'Kubernetes HPA automatically adjusts the number of pod replicas from observed metrics such as CPU, memory, or custom metrics. I use it when workload demand changes over time, but I first make sure resource requests are set correctly because HPA calculates utilization from them. I also check application readiness and cluster capacity, otherwise scaling more replicas will not solve the bottleneck.';
    }
    if (/terraform/i.test(input)) {
      return 'Terraform state is the record that maps the configuration to the real infrastructure resources Terraform manages. It lets Terraform calculate a safe plan, detect changes, and know what to update or destroy. In a team, I keep remote state in a protected backend with locking, for example S3 and DynamoDB, so concurrent applies do not corrupt the state.';
    }
    if (/crashloop|troubleshoot|error|failed/i.test(input)) {
      return 'I would start with the pod status, recent events, and container logs, including the previous container log if it restarted. Then I would verify the command, environment variables, mounted secrets, probes, and resource limits. Common causes are a bad startup configuration, an application crash, or an OOM kill. After fixing the root cause, I would redeploy and confirm the pod stays ready and error metrics return to normal.';
    }
    return 'I would give a direct definition first, then explain the operational impact and one practical check. For a DevOps system, I focus on automation, observability, security, and a safe rollout path. I would validate the change with logs and metrics, monitor the result after deployment, and keep a rollback option so the service remains reliable if the assumption is wrong.';
  }
}
