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

## Azure DevOps CI/CD

Azure DevOps Pipelines can automate build, test, infrastructure change, and
deployment. Treat a pipeline as a controlled delivery system, not merely a YAML
file that runs deployment commands. The pipeline should produce one traceable
artifact, promote that exact artifact between environments, use a short-lived
identity with only the required Azure permissions, and prove that the release is
healthy after it is deployed.

| Delivery stage | Good practice | Evidence to retain |
| --- | --- | --- |
| Pull request / CI | Run relevant tests, linting, dependency/security checks, build the image once, and publish its immutable digest to ACR. | Commit, pipeline run, test result, image digest, and scan result. |
| Infrastructure review | Render/validate Bicep and run a scoped `what-if` before a production change. Review unexpected deletes, replacements, scope changes, and parameter drift. | Reviewed change output and approved parameters. |
| Deployment | Deploy the already-built digest; do not rebuild per environment or deploy a mutable `latest` tag. Use a deployment job and an environment representing dev, staging, or production. | Environment/deployment history, digest, deployment revision, and change record. |
| Production control | Protect the production environment with the appropriate approval/check, then use rolling or canary rollout only when the service supports it. | Approver, check result, rollout step, and promotion/rejection decision. |
| Verification and recovery | Verify readiness plus a user-facing SLI such as error rate, latency, or successful business request. Roll back to the previously known-good digest if the release fails the criteria. | SLI window, rollback revision/digest, and incident or release note. |

### Identity boundaries that interview answers must keep separate

- **Pipeline Azure service connection:** the identity used by Azure Pipelines
  to deploy Bicep/ARM or call Azure. Prefer workload identity federation (WIF)
  over a stored client secret, authorize the service connection only for the
  necessary pipeline, and assign the smallest Azure role at the smallest
  workable scope.
- **AKS image-pull identity:** the AKS/platform identity that obtains an image
  from ACR. This is not the pipeline service-connection identity.
- **Runtime workload identity:** the identity used by a Pod to access Azure
  resources such as Key Vault. This is not proof that the cluster can pull
  images or that a pipeline can deploy infrastructure.

**Candidate-ready answer — “How would you design CI/CD for an AKS service in
Azure?”** “I would make the pull-request pipeline test and build the service
once, scan it, and push an immutable image digest to ACR. Before infrastructure
changes, I would run Bicep validation and what-if. The deployment pipeline
would use a least-privilege federated Azure service connection and promote the
same digest through environments, with production checks and a controlled
rolling or canary release. I would verify readiness and the service error-rate
and latency SLI, then roll back to the previous digest if those criteria fail.”

### Practical CI/CD incidents

#### Azure Pipeline service connection returns Unauthorized or AuthorizationFailed

- **Inspect:** capture the exact Azure caller, action, resource scope, and time
  from the pipeline and Azure activity/deployment logs. Check that the intended
  pipeline is authorized to use the service connection, then compare the WIF
  issuer and subject with the federated credential and check the Azure RBAC role
  at the actual target scope.
- **Act:** repair the incorrect federation, pipeline authorization, subscription/
  tenant selection, or narrow role assignment. Do not grant the pipeline Owner
  on a subscription just to get a green run.
- **Verify:** rerun the smallest safe change with the same connection, confirm
  the required action succeeds, and confirm an unrelated privileged action
  remains denied.

#### AKS rollout reaches ImagePullBackOff after a successful image build

- **Inspect:** use the Pod event and exact image reference first. Confirm the
  digest exists in the intended ACR, then check the AKS image-pull identity's
  ACR authorization and the cluster's DNS/egress path to the registry. A
  successful pipeline push does not prove that AKS can pull the image.
- **Act:** correct the image repository/digest, the specific registry
  authorization, or the verified network dependency. Avoid replacing a
  controlled identity with broad registry or subscription access.
- **Verify:** observe a new Pod pull the intended digest, complete its readiness
  checks, and confirm the running revision matches the approved release.

#### Bicep what-if shows an unexpected delete or replacement

- **Inspect:** stop before production deployment. Review the deployment scope,
  mode, parameters, module names, and any manual drift. Treat what-if as a
  review aid, not a guarantee: some runtime expressions cannot be resolved
  completely in advance.
- **Act:** correct the IaC or parameters so the reviewed desired state is
  intentional. If an emergency manual change is necessary, reconcile it back
  into source control rather than leaving two competing sources of truth.
- **Verify:** rerun validation and what-if, obtain the expected approval, then
  deploy in the intended scope and inspect the resulting Azure deployment.

#### A pipeline leaks a secret into a log or diagnostic artifact

- **Inspect:** stop sharing the run output, identify every exposed value and
  artifact/cache recipient, and determine whether the value was sent through
  an echoed command, command-line argument, generated file, or a non-secret
  variable. Log masking reduces accidental display but is not a substitute for
  secret handling.
- **Act:** revoke/rotate the exposed credential, remove the unsafe path, and
  retrieve the replacement at runtime from Key Vault or a protected secret
  variable group. Never put a secret in repository YAML or print it to prove a
  configuration works.
- **Verify:** inspect a new run and its artifacts for redaction, test the
  replacement credential from the intended identity only, and document the
  exposure response.

#### A canary deployment increases errors after initial success

- **Inspect:** compare the canary and stable revisions using the release
  digest, error rate, latency, saturation, and dependency failures over a
  defined window. Do not promote simply because Kubernetes reports Pods ready.
- **Act:** reject/pause promotion and roll back to the known-good digest when
  the agreed SLI threshold is breached. Preserve logs, metrics, and the
  deployment revision for diagnosis; do not retag the failed image as stable.
- **Verify:** confirm traffic/revision state, recovery of the SLI, and that the
  next release has a focused corrective test or guardrail.

## Senior production design and operations

A senior Azure answer should start from a service objective and constraints, not
from a shopping list of Azure services. State the availability target, RTO/RPO,
data classification/residency, expected traffic and growth, deployment risk,
operating ownership, and cost envelope. Then explain which decision protects
which failure mode and how the team will test it.

### AKS production baseline

| Concern | Production decision | What to validate |
| --- | --- | --- |
| Availability | Use multiple replicas, readiness/liveness/startup probes, Pod Disruption Budgets, and topology rules appropriate to the workload. Use availability zones when the region and workload availability target justify them. | A node drain, an application rollout, and a single-zone failure exercise preserve the agreed minimum service capacity. |
| Capacity | Set CPU/memory requests and limits from measured load; use HPA/cluster autoscaling only with explicit minimums, maximums, and quota/capacity headroom. | Load test peak and scale-out behavior; watch pending Pods, throttling, OOMKills, saturation, and cost together. |
| Workload isolation | Keep platform/system workloads separate from application node pools where the design requires it. Use namespaces, RBAC, quotas, network policy, and separate identities as boundaries, not merely naming conventions. | A tenant/workload cannot consume another's quota, retrieve its secrets, or reach an unapproved dependency. |
| Upgrade safety | Schedule supported Kubernetes and node-image upgrades, test a representative workload first, and account for PDBs, compatibility, capacity surge, and maintenance windows. | Upgrade a non-production environment, then a controlled production slice; verify health, latency, errors, and rollback/recovery criteria. |
| Observability | Correlate deployment revision/digest with application SLI, Kubernetes events/restarts, node capacity, Azure activity logs, and dependency telemetry. | An on-call engineer can identify the affected version, blast radius, owner, and safe rollback path within the incident target. |
| Data and recovery | Define recovery for both Kubernetes configuration and application data. Backups are not high availability; restore procedures must be tested against the agreed RTO/RPO. | A timed restore exercise recovers data and the application configuration into an isolated target without bypassing access controls. |

### Production delivery guardrails

- Separate subscriptions/environments and deployment permissions according to
  the organization’s boundary; a successful dev deployment is not authorization
  to change production.
- Treat approval as a governance control, not a substitute for automated tests,
  policy, security checks, or production telemetry. Restrict who can approve
  and keep an auditable deployment history.
- Use progressive delivery only with pre-agreed promotion criteria. A canary is
  useful when traffic can be isolated and the SLI is meaningful; otherwise use
  a controlled rolling release with a tested rollback.
- Use an expand/contract migration for a schema change that must coexist with
  old and new application versions: add compatible structure, deploy
  compatible code, migrate/backfill under observation, switch reads, then
  remove the old structure in a later release. A container rollback alone
  cannot safely undo a destructive database change.
- Protect the delivery path itself: least-privilege WIF, protected branches,
  reviewed IaC, immutable artifacts, secret-free logs, and retention/audit
  appropriate to the organization. A production fix made only in the portal
  must be reconciled into IaC.

### Senior production incidents

#### An AKS upgrade stalls or reduces capacity during a release window

- **Inspect:** establish the node-pool upgrade state, pending/evicted Pods,
  PDB constraints, replica count, readiness failures, available surge
  capacity, quota, and application SLI. Separate an expected PDB delay from an
  actual workload incompatibility.
- **Act:** pause or roll back the safest available upgrade path when the
  service objective is at risk; add capacity or correct the verified PDB,
  probe, scheduling, or compatibility issue before continuing. Do not delete
  PDBs or force-evict critical Pods merely to complete maintenance.
- **Verify:** complete the staged upgrade, then prove steady replicas,
  scheduling headroom, error/latency recovery, and the documented next
  maintenance procedure.

#### A region-level failure is outside the service objective

- **Inspect:** compare the promised RTO/RPO with actual dependencies: database,
  storage, DNS/traffic routing, ACR image availability, secrets, identity,
  configuration, and the secondary region's capacity. Zone redundancy inside
  one region does not provide regional disaster recovery.
- **Act:** invoke the rehearsed regional recovery/failover plan. Restore or
  promote only in the order required by data consistency and the selected
  active-active or active-passive design; communicate the accepted data-loss
  boundary rather than claiming zero loss by default.
- **Verify:** use a controlled failover exercise to measure recovery time,
  validate data consistency against the RPO, confirm traffic reaches the
  healthy region, and record gaps in the runbook and capacity plan.

#### Autoscaling keeps the service available but creates an unexpected cost spike

- **Inspect:** correlate traffic, HPA/VPA decisions where used, cluster
  autoscaler activity, requests/limits, replica/node count, log ingestion,
  and release time. Check whether a retry storm, bad resource request, leaked
  queue consumer, or intentionally higher load is the driver.
- **Act:** mitigate the verified demand safely: apply rate limits/backpressure,
  fix retry behavior, right-size the workload, or adjust bounded scaling
  policy. Do not cap capacity below measured safe demand simply to flatten a
  cost chart.
- **Verify:** observe a controlled reduction in saturation and cost while
  preserving error-rate/latency objectives, then set alert thresholds for both
  reliability and spend signals.

**Candidate-ready answer — “What makes an Azure deployment production-ready?”**
“I start with an explicit availability and recovery target, then design the
workload and its dependencies around that target. For AKS, that means measured
resource requests and limits, multiple replicas, probes, disruption budgets,
safe upgrade capacity, least-privilege identities, and telemetry tied to the
release digest. The delivery pipeline promotes one immutable artifact through
guarded environments and validates user-facing SLI before promotion. I also
require a tested rollback and restore path, because a backup or a green
Kubernetes rollout alone does not prove the service can recover.”

## IaC and governance answer pattern

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
- [Workload identity federation for Azure Pipelines service connections](https://learn.microsoft.com/en-us/azure/devops/pipelines/release/configure-workload-identity?view=azure-devops)
- [Azure Pipelines environments, approvals, and checks](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/environments?view=azure-devops)
- [Azure Pipelines deployment jobs and strategies](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/deployment-jobs?view=azure-devops)
- [Bicep what-if](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/deploy-what-if)
- [Secret handling in Azure Pipelines](https://learn.microsoft.com/en-us/azure/devops/pipelines/security/secrets?view=azure-devops)
- [Troubleshoot pulling an ACR image from AKS](https://learn.microsoft.com/en-us/troubleshoot/azure/azure-kubernetes/connectivity/cannot-pull-image-from-acr-to-aks-cluster)
- [AKS architecture best practices](https://learn.microsoft.com/en-us/azure/well-architected/service-guides/azure-kubernetes-service)
- [AKS deployment and cluster reliability](https://learn.microsoft.com/en-us/azure/aks/best-practices/reliability)
- [AKS backup and recovery operations](https://learn.microsoft.com/en-us/azure/architecture/operator-guides/aks/aks-backup-and-recovery)
