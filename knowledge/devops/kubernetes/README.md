# Kubernetes

## Core concepts

- A Deployment manages ReplicaSets and declarative pod rollouts; a Service
  gives a stable network endpoint; Ingress/Gateway exposes HTTP routing.
- Requests affect scheduling and HPA utilization calculations; limits constrain
  usage. Poor values can cause unschedulable pods, throttling, or OOM kills.
- Readiness controls whether traffic reaches a pod. Liveness restarts a stuck
  container. Startup probes protect slow applications from premature liveness
  failures.

## Troubleshooting order

1. `kubectl get pods -n NAMESPACE` and `kubectl describe pod` for phase, events,
   image pull, scheduling, probes, and restarts.
2. Read current and previous logs with `kubectl logs POD -c CONTAINER --previous`.
3. Verify command, image tag, ConfigMaps, Secrets, service account, volume
   mounts, resource settings, and dependencies.
4. Trace traffic through Service endpoints, DNS, NetworkPolicy, Ingress, and
   application readiness.
5. Fix one verified root cause, roll out safely, and confirm replicas, errors,
   latency, and resource pressure are healthy.

## Interview answer points

- HPA changes replica count from observed metrics; it needs meaningful requests
  and enough cluster capacity. It cannot fix a single-threaded bottleneck or a
  broken downstream dependency.
- For CrashLoopBackOff, inspect the prior container log and termination reason;
  common causes include bad configuration, failed probes, missing secrets, and
  OOM kills.
- Use rolling updates with readiness gates, `maxUnavailable`, `maxSurge`, and a
  rollback plan. Use canary/blue-green when risk or validation needs demand it.

## Practical interview scenarios

### A Pod remains Pending

- **Inspect:** use `kubectl describe pod` and cluster events to distinguish
  insufficient requested resources, taints/tolerations, affinity, topology,
  quota, an unbound PVC, or scheduler/configuration failure.
- **Act:** correct the verified scheduling constraint or add appropriate
  capacity. Do not reduce requests blindly; requests represent the capacity the
  scheduler reserves and may be required for predictable service behavior.
- **Verify:** confirm the Pod is scheduled to a suitable node, becomes Ready,
  receives traffic, and leaves safe node/cluster headroom.

### A Pod enters CrashLoopBackOff after a release

- **Inspect:** check `kubectl logs ... --previous`, container termination reason
  and exit code, events, command, configuration/Secrets, mounts, probes, and
  memory limits. Compare the image digest and inputs with the previous release.
- **Act:** roll back when impact is active, then correct the verified startup,
  probe, dependency, or OOM issue. Deleting the Pod only restarts the same spec.
- **Verify:** watch rollout status, Ready replicas, restart count, application
  errors/latency, and resource usage through a meaningful observation window.

### A rollout completes but users receive 503 responses

- **Inspect:** trace Ingress/Gateway to Service, EndpointSlices, selectors,
  target ports, readiness, NetworkPolicy, and application logs. Confirm whether
  old and new ReplicaSets are serving and correlate the deployment time.
- **Act:** pause or roll back the rollout if the service SLI regressed. Correct
  selectors, ports, readiness, or application behavior before resuming.
- **Verify:** test through the public route, confirm healthy endpoints in every
  intended zone, and watch error rate and tail latency—not rollout status alone.

### HPA does not scale during load

- **Inspect:** check HPA conditions/current metrics, Metrics API availability,
  resource requests, target definition, stabilization behavior, min/max
  replicas, pending Pods, and cluster capacity.
- **Act:** repair metric collection or target configuration and ensure capacity
  exists. Choose a metric that represents demand; scaling on CPU cannot repair
  a blocked downstream or an application concurrency limit by itself.
- **Verify:** run controlled load and observe metric movement, desired/actual
  replicas, scheduling, latency, errors, and scale-down stability.

## Senior production lens

- Separate cluster/platform reliability from workload reliability. A healthy
  control plane does not prove Pods have capacity, correct probes, safe
  disruption budgets, working dependencies, or a user-facing SLO.
- For critical workloads, define replicas, topology spread, PDBs, requests and
  limits, autoscaling bounds, quota, node-pool capacity, and upgrade surge
  before the rollout window. Validate these choices with controlled failure and
  load exercises.
- Treat a namespace as an organizational boundary, not a complete security
  boundary. Combine Kubernetes RBAC, workload identity, network policy, pod
  security controls, resource quotas, and separate clusters/accounts when the
  risk boundary requires it.
- A production rollback uses a known-good revision and validates endpoints plus
  SLI. It must also consider compatible schema, queue, and configuration
  changes; a Deployment rollback alone is not a complete recovery strategy.

## Concise interview delivery

“I begin with Pod status, events, previous logs, and the desired spec, then
separate scheduling, startup, health-probe, networking, and resource failures.
I mitigate with a paused rollout or rollback when users are affected, fix the
declarative source, and verify Ready endpoints plus service SLO signals.”

## Common pitfalls

- Do not treat `kubectl delete pod` as a root-cause fix for a Deployment.
- Do not use liveness probes for downstream dependency checks that can create a
  restart storm.
- Secrets are encoded, not automatically encrypted end-to-end; apply RBAC,
  encryption-at-rest, and an external secret-management strategy where needed.

## Official references

- [Troubleshooting Kubernetes applications](https://kubernetes.io/docs/tasks/debug/debug-application/)
- [Resource management for Pods and containers](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [Liveness, readiness, and startup probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)
- [Horizontal Pod Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
