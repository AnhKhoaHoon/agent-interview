# Azure

## Core concepts

- Azure management is organized from Microsoft Entra tenant through management
  groups and subscriptions to resource groups and individual resources. A
  resource group is a lifecycle and management boundary; do not treat its name
  as proof of network isolation or authorization.
- Microsoft Entra ID supplies identities and authentication. Azure RBAC grants
  a principal the permitted actions on Azure resources at a management-group,
  subscription, resource-group, or resource scope. Use the smallest useful
  scope and role; authentication alone does not grant resource access.
- Managed identities remove the need for an application to carry a client
  secret. They still require an explicit, least-privilege role assignment and
  must be separated by workload where their permissions differ.
- A virtual network (VNet) contains subnets, routes, and network controls.
  Network security groups filter traffic, while routing determines the path.
  Private Endpoints expose a service through a private IP; correct private DNS
  resolution is part of the design, not an optional afterthought.
- Azure Container Registry (ACR) stores container images. Promote an approved
  image digest rather than trusting a mutable tag, and keep the identity that
  pulls an image separate from the identity used by the running workload.
- Azure Monitor brings together metrics, logs, traces, and alerts. A useful
  alert starts from a user-impacting SLI and links to enough context to find
  the affected resource, deployment, and request path.

## Azure services commonly expected in a DevOps interview

| Need | Azure service or control | Practical decision |
| --- | --- | --- |
| Identity and automation | Microsoft Entra ID, Azure RBAC, managed identities, workload identity federation | Prefer short-lived, scoped identities for CI and workloads; do not place service-principal secrets in repositories, images, or browser extensions. |
| Network boundary | VNet, subnet, route table, NSG, Azure Firewall/NVA, Private Link, Private DNS | Trace DNS, routes, and filtering together. A private endpoint without the correct DNS zone/link can still send a client to the wrong address. |
| Containers | AKS, ACR, Kubernetes RBAC, workload identity | Deploy an immutable image digest and give each workload its own minimal Azure access instead of broad node-level permission. |
| Secrets and keys | Azure Key Vault, managed identities, private endpoint where required | Keep secret retrieval at runtime scoped to the caller; audit the identity, target vault, permission model, and network path for an access failure. |
| IaC and governance | Bicep/ARM, Azure Policy, management groups, tags | Review the intended change before deployment, enforce guardrails at an appropriate scope, and avoid making a one-off portal fix the source of truth. |
| Observability | Azure Monitor, Log Analytics, Application Insights, Container Insights, managed Prometheus/Grafana for AKS | Separate platform health from application SLI, retain actionable logs, and test that an alert reaches its owner with a runbook. |

## AKS and workload identity

- AKS manages the Kubernetes control plane, but the team still owns workload
  configuration, node-pool capacity, requests/limits, network design, image
  supply chain, RBAC, and application reliability.
- For a Pod that needs an Azure resource, use Microsoft Entra Workload ID when
  appropriate. It uses a Kubernetes service-account token and OIDC federation
  to obtain Azure access for that workload. It is not the same identity as an
  image-pull identity or the AKS control-plane/node identity.
- Monitor the cluster at both layers: Kubernetes events, Pods, restarts,
  requests/limits, and application latency/errors; then Azure resource metrics,
  activity/resource logs, and the network/identity dependencies around it.
- AKS monitoring choices depend on the cluster mode and configured add-ons.
  State what is enabled in the target cluster; do not assume every AKS cluster
  has the same agents, workspace, or dashboards.

## Azure Landing Zone

An **Azure Landing Zone** is not a landing page. It is a repeatable,
governed foundation for running workloads across multiple Azure subscriptions.
The platform landing zone centralizes shared identity, network, security,
governance, and operations capabilities. Workload landing zones are the
subscriptions/environments in which application teams deploy and operate their
own resources inside those guardrails.

It works by defining the management hierarchy, subscription model, Azure RBAC,
policy, network connectivity, logging, and security baselines before teams
deploy workloads. Those common controls are implemented through IaC and applied
at the right scope; a new workload then receives an appropriately isolated
subscription/environment rather than rebuilding foundational controls by hand.

**Candidate-ready answer:** “An Azure Landing Zone is a standardized,
multi-subscription foundation for Azure. The platform team provides shared
identity, networking, policy, security, and observability guardrails, while
workload teams deploy their applications in their own landing zones. It lets an
organization scale cloud adoption consistently without giving every team broad
subscription-level control. I would implement it with reviewed IaC and verify
that policy, least-privilege access, logging, and network paths work before
onboarding production workloads.”

**Interview distinction:** do not describe a Landing Zone as one Azure service
or one resource group. It is an architecture and operating model; its exact
implementation depends on organizational, compliance, and connectivity needs.

## Azure Logic Apps

Azure Logic Apps is a managed integration and workflow-automation service. A
workflow begins with one trigger—such as a schedule, HTTP request, queue/file
event, or SaaS event—then runs actions, conditions, loops, transformations, and
error-handling steps. Connectors let it coordinate Azure services, SaaS systems,
on-premises systems, and custom APIs without writing all integration plumbing.

Use it for orchestration between systems: for example, receive an alert, enrich
it from a CMDB/API, create a ticket, notify an on-call channel, and record the
result. It is not a replacement for a latency-sensitive application API or a
general container runtime. Choose its hosting and networking model deliberately
when private/VNet or predictable runtime requirements apply.

**Candidate-ready answer:** “Azure Logic Apps is a managed workflow and
integration service. It starts from a trigger and executes connected actions
through connectors, conditions, and error handling, so it is useful for
automating cross-system processes such as alert-to-ticket or file-to-Blob
workflows. I would secure every connector with a least-privilege managed
identity where possible, make retries and idempotency explicit, and monitor
run history, failures, and downstream rate limits.”

**Operational checks:** for a failed workflow, identify the trigger/run ID,
failed action and its inputs/outputs after redaction, connector identity,
network path, retry policy, downstream response, and whether retrying could
create a duplicate side effect. Fix the narrow failure and verify one end-to-end
run plus duplicate-handling behavior.

### AKS workload cannot read a Key Vault secret

- **Inspect:** identify the exact Pod and Kubernetes service account; inspect
  the Entra workload-identity/OIDC mapping, the resulting Azure principal, the
  Key Vault permission model and least-privilege role/permission, and the
  vault's public/private network path. Use the denied request and Azure/Kubernetes
  logs rather than guessing from a generic 403.
- **Act:** correct the specific federation, service-account annotation, role
  assignment, permission, or private-DNS/network configuration. Do not grant
  broad Key Vault access to every node or give the workload an Owner role.
- **Verify:** retry from the same workload, confirm only the intended secret
  action succeeds, run a negative-access check, and record the principal in
  audit evidence.

### AKS deployment is healthy but telemetry is missing

- **Inspect:** establish whether the fault is in the application instrumentation,
  cluster monitoring configuration, agent/data-collection path, workspace
  access, query time range, or alert rule. Compare the time of the deployment
  with agent events and ingestion signals.
- **Act:** repair the missing configuration or access at the narrowest scope;
  do not declare the incident solved simply because a dashboard has no data.
- **Verify:** generate controlled traffic, follow one request through the
  expected metrics/logs/traces, confirm alert evaluation, and check ingestion
  cost/retention remains intentional.

## Networking, security, and incident response

### A service works publicly but fails through a Private Endpoint

- **Inspect:** resolve the service name from the affected VNet, confirm the
  answer is the intended private IP, check the Private DNS zone and VNet link,
  endpoint approval/provisioning, route path, NSG/firewall policy, and client
  identity. Compare a working and failing client rather than changing DNS
  globally first.
- **Act:** repair the exact private-DNS association, routing, or narrow network
  control. Avoid a permanent public-endpoint fallback that defeats the intended
  boundary.
- **Verify:** test from every required subnet, confirm the name resolves to the
  private address, validate the approved request path, and ensure an unintended
  client remains denied.

### An Azure deployment fails with AuthorizationFailed

- **Inspect:** capture the exact caller, action, resource ID, scope, and time
  from the deployment/activity log. Then evaluate role assignments, explicit
  deny assignments or policy effects, the CI federation/service connection, and
  whether the target scope differs from the scope that was authorized.
- **Act:** add or correct only the required role at the narrowest scope. Do not
  make the pipeline Owner or Contributor across a subscription merely to prove
  the cause.
- **Verify:** rerun the smallest safe deployment, confirm the intended action
  succeeds, and verify an unrelated privileged action is still denied.

### AKS cost rises after a rollout

- **Inspect:** compare node-pool size/VM SKU, pending Pods, requests/limits,
  autoscaler and HPA behavior, replica count, image pull/storage, Log Analytics
  ingestion, and orphaned public IP/disks/load balancers before attributing the
  increase to one component.
- **Act:** fix the verified demand or configuration: right-size requests,
  correct scaling limits, remove genuinely unused resources under change
  control, or adjust intentionally excessive log volume/retention. Do not cut
  capacity below the service's measured headroom just to reduce a cost graph.
- **Verify:** use a controlled load window to check cost trend, scheduling
  headroom, latency/errors, and scale-down stability together.

## IaC, CI/CD, and governance answer pattern

Use Bicep or another reviewed IaC workflow to express Azure resources
declaratively. Validate and review the planned change, deploy through a
least-privilege federated CI identity, and keep environment-specific values out
of source where they are sensitive. Use Azure Policy and management hierarchy
for guardrails such as permitted regions, tags, or required controls, but test
policy changes in a safe scope first because a broad deny can block delivery.

For an Azure DevOps or GitHub Actions deployment answer, separate the CI
identity that changes Azure, the AKS/ACR platform identities, and the runtime
workload identity. Build once, scan and record the artifact digest, promote the
same digest with an approval/rollback path, then verify application SLI and
Azure control-plane evidence. This is safer than rebuilding an untraceable
``latest`` image for each environment.

## Architecture answer pattern

1. Clarify availability, latency, data residency, RTO/RPO, identity, and cost
   requirements before selecting services.
2. Segment VNet/subnets and private dependencies deliberately; document DNS,
   ingress/egress, and the failure domain of each component.
3. Use independent, least-privilege identities for CI, platform operations, and
   application workloads.
4. Make deployments and recovery repeatable through IaC, immutable artifacts,
   health checks, backups, rollback, and tested restore/failure exercises.
5. Instrument user-facing SLI/SLO, resource saturation, audit events, and
   cost. Explain one reliability or cost trade-off rather than listing every
   Azure service.

## Common interview pitfalls

- Microsoft Entra identity, Azure RBAC authorization, Key Vault permissions,
  and network access are separate checks. A successful login does not prove a
  workload can read a secret.
- A VNet/subnet name does not determine whether a workload is private. Inspect
  public IP assignment, routes, DNS, and the actual ingress/egress controls.
- Do not solve an AKS workload permission error by broadening node or
  subscription permissions. Fix the workload's identity and smallest required
  role.
- Do not call a deployment successful solely because ARM/Bicep reports
  success. Verify workload readiness, dependency access, user-facing SLI, and
  rollback behavior.

## Official references

- [Azure RBAC overview](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview)
- [Managed identities for Azure resources](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview)
- [Azure Private Endpoint overview](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview)
- [AKS Microsoft Entra Workload ID](https://learn.microsoft.com/en-us/azure/aks/workload-identity-overview)
- [Monitor AKS](https://learn.microsoft.com/en-us/azure/aks/monitor-aks?tabs=non-cilium)
- [Azure Monitor overview](https://learn.microsoft.com/en-us/azure/azure-monitor/)
- [Azure Policy assignment with Bicep](https://learn.microsoft.com/en-us/azure/governance/policy/assign-policy-bicep)
- [Azure Landing Zones](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/?tabs=platvsapp)
- [Azure Logic Apps overview](https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-what-are-logic-apps)
