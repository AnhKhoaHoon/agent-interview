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

## Common pitfalls

- Do not treat `kubectl delete pod` as a root-cause fix for a Deployment.
- Do not use liveness probes for downstream dependency checks that can create a
  restart storm.
- Secrets are encoded, not automatically encrypted end-to-end; apply RBAC,
  encryption-at-rest, and an external secret-management strategy where needed.
