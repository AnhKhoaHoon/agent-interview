# DevOps baseline benchmark

Run: devops-baseline-2026-11-19
Started: 2026-11-19T03:40:07.242Z

Scope: 30 DevOps cases × 3 repetitions per path; text first, then real Chrome tab audio.
No model, prompt, VAD, RAG, retry, or quality policy optimization is part of this baseline.

Budget: 90/180 turn submissions; 351/1200 backend requests.
Provider upper bound (including existing SDK retries): 1350.
This upper bound is a conservative bound, not a measured bill or count of actual upstream retries.

Latency percentiles use every available measurement, including failed turns with observed tokens; missing values are counted explicitly. Failed/missing measurements never count as SLO successes.
STT is the backend service duration from logs (includes transcript handoff). LLM provider timing excludes RAG/preparation. First-visible is a foreground, visible-element double-animation-frame approximation after React commits, not proof of physical display scanout.
Audio reference speech end comes from the playback clock and annotated WAV offset; VAD speech end is recorded separately. No audio bytes or bearer/provider credentials are exported.
Lexical scores are screening only. Final quality requires an answer-hash-bound reference review; reviewer method is recorded. An unreviewed response cannot pass.

| Path | Planned | Attempted | Completed | Failed | Timeout | Blocked | Not run |
|---|---:|---:|---:|---:|---:|---:|---:|
| text | 90 | 90 | 88 | 2 | 0 | 0 | 0 |
| audio | 90 | 0 | 0 | 0 | 0 | 0 | 90 |

| Path / metric (ms) | Measured | Missing | Median | p95 |
|---|---:|---:|---:|---:|
| text / sttMs | 0 | 90 | n/a | n/a |
| text / providerFirstTokenMs | 90 | 0 | 1222 | 3476 |
| text / providerTotalMs | 88 | 2 | 2285.5 | 5715 |
| text / answerPreparationMs | 90 | 0 | 2 | 3 |
| text / requestToFirstTokenMs | 90 | 0 | 1229.5 | 3530 |
| text / requestToCompletedMs | 90 | 0 | 2311 | 5731 |
| text / speechEndToFirstVisibleMs | 0 | 90 | n/a | n/a |
| text / speechEndToCompletedMs | 0 | 90 | n/a | n/a |
| audio / sttMs | 0 | 0 | n/a | n/a |
| audio / providerFirstTokenMs | 0 | 0 | n/a | n/a |
| audio / providerTotalMs | 0 | 0 | n/a | n/a |
| audio / answerPreparationMs | 0 | 0 | n/a | n/a |
| audio / requestToFirstTokenMs | 0 | 0 | n/a | n/a |
| audio / requestToCompletedMs | 0 | 0 | n/a | n/a |
| audio / speechEndToFirstVisibleMs | 0 | 0 | n/a | n/a |
| audio / speechEndToCompletedMs | 0 | 0 | n/a | n/a |

Audio end-to-end performance: **incomplete** (target median <3000 ms, p95 <6000 ms, completion ≥98%).
Audio completed within 3s: 0/0; within 6s: 0/0.
Text API latency is diagnostic; it cannot satisfy the audio-to-visible SLO.

## Configuration and provenance

```json
{
  "commit": "a82eef4a18d5fd247b014a25a4167de82db6819b",
  "worktreeStatus": "?? benchmarks/\n?? docker-compose.override.yml\n?? reports/",
  "settings": {
    "NODE_ENV": "development",
    "LLM_PROVIDER": "openai",
    "LLM_MODEL": "gpt-6.1-sol",
    "LLM_ROUTINE_MODEL": "gpt-6-luna",
    "LLM_REASONING_EFFORT": "low",
    "LLM_MAX_OUTPUT_TOKENS": "600",
    "LLM_VERBOSITY": "low",
    "LLM_ROUTINE_REASONING_EFFORT": "low",
    "LLM_ROUTINE_MAX_OUTPUT_TOKENS": "320",
    "LLM_ROUTINE_VERBOSITY": "low",
    "LLM_TIMEOUT_MS": "15000",
    "LLM_MAX_RETRIES": "2",
    "STT_PROVIDER": "openai",
    "STT_MODEL": "gpt-transcribe",
    "STT_TIMEOUT_MS": "20000",
    "STT_MAX_RETRIES": "2",
    "EMBEDDING_MODEL": "text-embedding-3-small",
    "EMBEDDING_MAX_RETRIES": "2",
    "EMBEDDING_TIMEOUT_MS": "10000",
    "RAG_ENABLED": "true",
    "RAG_MAX_CHUNKS": "4",
    "RAG_MIN_SIMILARITY": "0.72",
    "RAG_MIN_KEYWORD_COVERAGE": "0.35"
  },
  "hashes": {
    "backend/src/ai/prompt/prompt-builder.service.ts": "497dce80bf82cb749605fd6a01ad07625059a3137408fc55242067c65f1b48ca",
    "backend/src/ai/planner/interview-answer-planner.service.ts": "709fe0121b5fe41b5066fb0c0df13b59a71edd2b4d66cdf469ca592d0652dc43",
    "backend/src/ai/providers/openai-llm.provider.ts": "638a9a8d1c31a71fdb35075ae12225ca4976e89c209c8e4e9d2f056529c57ddb",
    "backend/src/transcription/providers/openai-stt.provider.ts": "5371f8824270b3751f9e41200cda1825315bf54dfcf4b4ab0f2484ecc1e283e4",
    "extension/src/audio/vad-config.ts": "327442df8bee7838004872ccda7260b5e73cbf08c0eeae0404a7cbfc08ebc009",
    "benchmarks/cases.mjs": "c8e61ff10cc0751fba9ca4958a3d4b55482dfe22bc8acd83d1d162d4366b7f4d"
  },
  "node": "v26.9.0",
  "platform": "darwin",
  "backendImage": "sha256:547d2942e7a438a1404b2aa8372e913d188ba16243cf4dad1a344497ff96766f",
  "load": "serial; no warmup; all planned attempts retained",
  "qualityPolicy": "Lexical screening plus optional answer-hash-bound reference review; no additional judge API calls"
}
```

## Trials

### text-devops-01-1

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Docker là gì?

Transcript: not measured (text path or not run)

Answer: Docker là nền tảng dùng để đóng gói và chạy ứng dụng trong các container, với môi trường và phần phụ thuộc cần thiết. Image Docker là gói bất biến theo từng lớp, còn container là phiên bản đang chạy của image đó.

Reference: Docker đóng gói ứng dụng cùng phụ thuộc thành image và chạy thành container. Container là tiến trình được cô lập và chia sẻ kernel của host; image là khuôn đóng gói, khác với container đang chạy.

- Đóng gói ứng dụng và phụ thuộc
- Phân biệt image và container
- Cô lập tiến trình

Sources: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/

Metrics: {"sttMs":null,"providerFirstTokenMs":3476,"providerTotalMs":4037,"answerPreparationMs":13,"requestToFirstTokenMs":3530,"requestToCompletedMs":4087,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-02-1

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: What is the difference between a Docker image and a container?

Transcript: not measured (text path or not run)

Answer: The key distinction is that a Docker image is a packaged, read-only layered artifact, while a container is a running instance of that image with its own writable layer and runtime state. Images are reusable and remain unchanged when a container writes data; container changes are not part of the image and may be lost when the container is removed. Use an image to package and distribute an application; use a container to run it. The trade-off is that containers provide runtime isolation but require separate handling for persistent data.

Reference: An image is a packaged, read-only template. A container is an instance created from it, with a writable layer and process lifecycle. Containers can be stopped; an existing image is not modified by writing inside one.

- Image là template
- Container là instance
- Writable layer hoặc lifecycle

Sources: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/

Metrics: {"sttMs":null,"providerFirstTokenMs":1930,"providerTotalMs":2806,"answerPreparationMs":2,"requestToFirstTokenMs":1939,"requestToCompletedMs":2814,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-03-1

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Kubernetes HPA là gì?

Transcript: not measured (text path or not run)

Answer: HPA trong Kubernetes là cơ chế tự động điều chỉnh số lượng replica của workload dựa trên các chỉ số như mức sử dụng CPU. HPA thay đổi số lượng Pod, không tự tăng tài nguyên của từng Pod.

Reference: HPA điều chỉnh số replica của workload dựa trên metrics như CPU, memory hoặc custom metrics. Nó scale pod theo chiều ngang; không tự tăng số node. Với CPU utilization, cần resource requests và nguồn metrics phù hợp.

- Scale replica/pod
- Dựa trên metrics
- Phân biệt node scaling

Sources: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/

Metrics: {"sttMs":null,"providerFirstTokenMs":1062,"providerTotalMs":1501,"answerPreparationMs":2,"requestToFirstTokenMs":1072,"requestToCompletedMs":1510,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-04-1

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: How do readiness and liveness probes differ in Kubernetes?

Transcript: not measured (text path or not run)

Answer: A readiness probe determines whether a container is ready to receive traffic, while a liveness probe determines whether it should be restarted. A failed readiness probe removes the pod from service endpoints; a failed liveness probe triggers a container restart.

Reference: Readiness controls whether a pod receives service traffic. Liveness failures can restart a container. Startup probes protect slow initialization. A downstream dependency failure should not automatically trigger a restart loop; choose probe conditions and thresholds carefully.

- Readiness controls traffic
- Liveness restarts container
- Phân biệt failure action

Sources: https://kubernetes.io/docs/concepts/workloads/pods/probes/

Metrics: {"sttMs":null,"providerFirstTokenMs":878,"providerTotalMs":1333,"answerPreparationMs":1,"requestToFirstTokenMs":888,"requestToCompletedMs":1341,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-05-1

Status: **completed**; quality: **needs_review**; screening: 33/100; reviewed score: n/a/100.

Question: Terraform state dùng để làm gì?

Transcript: not measured (text path or not run)

Answer: Terraform state lưu ánh xạ giữa các tài nguyên được khai báo trong cấu hình và tài nguyên thực tế, giúp Terraform biết hiện trạng để tính toán thay đổi. Nó không phải là cấu hình mong muốn; cấu hình mô tả trạng thái đích, còn state ghi nhận những gì Terraform đang quản lý.

Reference: State ánh xạ cấu hình Terraform tới tài nguyên thực và lưu metadata phục vụ plan. State có thể chứa dữ liệu nhạy cảm nên cần bảo vệ, backup, và dùng remote backend có locking phù hợp cho nhóm.

- Ánh xạ tài nguyên
- Plan hoặc metadata
- Bảo vệ state

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":949,"providerTotalMs":1651,"answerPreparationMs":4,"requestToFirstTokenMs":961,"requestToCompletedMs":1663,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-06-1

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Compare Terraform and AWS CloudFormation. When would you choose each?

Transcript: not measured (text path or not run)

Answer: Terraform uses a provider-based model to manage resources across multiple platforms, while CloudFormation is AWS-native and manages AWS resources through stacks. Terraform’s broader scope makes it useful in mixed environments, but adds provider and state-management concerns. CloudFormation integrates directly with AWS services and stack operations, but is less suitable for consistent management across cloud providers. I’d choose Terraform for multi-platform infrastructure; I’d choose CloudFormation for an AWS-only environment where native integration matters more than portability.

Reference: Terraform uses providers and supports multiple platforms, while CloudFormation is AWS-native and manages stacks through AWS. Choose based on platform coverage, team skills, state/stack operations, and integration needs; neither automatically eliminates drift or deployment risk.

- Terraform providers/platforms
- CloudFormation AWS-native
- Choice and trade-off

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":942,"providerTotalMs":2194,"answerPreparationMs":2,"requestToFirstTokenMs":949,"requestToCompletedMs":2201,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-07-1

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Một commit lỗi đã được push lên nhánh chung. Nên dùng git revert hay reset?

Transcript: not measured (text path or not run)

Answer: Với commit lỗi đã được push lên nhánh chung, thường nên dùng `git revert`: lệnh này tạo commit mới để đảo ngược thay đổi mà không viết lại lịch sử chung. `git reset` thay đổi vị trí nhánh và có thể buộc phải viết lại lịch sử đã được chia sẻ.

Reference: Ưu tiên git revert để tạo commit đảo thay đổi mà không viết lại lịch sử dùng chung. Kiểm tra commit và chạy test trước khi merge/push. Reset phù hợp hơn với lịch sử local; force push nhánh chung cần quy trình phối hợp riêng.

- Ưu tiên revert
- Giữ lịch sử dùng chung
- Kiểm tra kết quả

Sources: https://git-scm.com/docs/git-revert

Metrics: {"sttMs":null,"providerFirstTokenMs":1003,"providerTotalMs":1596,"answerPreparationMs":2,"requestToFirstTokenMs":1012,"requestToCompletedMs":1603,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-08-1

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: A Linux server reports disk full, but du shows little usage. How do you investigate?

Transcript: not measured (text path or not run)

Answer: I’d first confirm which filesystem is full with `df -h` and `df -i`, since the issue may be exhausted inodes rather than disk space. Then I’d check for deleted files still held open by processes with `lsof +L1`; those files use space until the owning process closes them.

Reference: Compare filesystem space and inode usage with df -h and df -i. Check mount boundaries and deleted-but-open files using lsof +L1. Release space through a controlled log rotation or process action; verify capacity and service health rather than deleting files blindly.

- Filesystem/inodes
- Deleted open files
- Safe mitigation and verification

Sources: https://man7.org/linux/man-pages/man1/df.1.html

Metrics: {"sttMs":null,"providerFirstTokenMs":945,"providerTotalMs":1887,"answerPreparationMs":1,"requestToFirstTokenMs":951,"requestToCompletedMs":1895,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-09-1

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Pod Kubernetes không resolve được DNS của một Service. Bạn kiểm tra gì?

Transcript: not measured (text path or not run)

Answer: Tôi kiểm tra trước phạm vi ảnh hưởng, rồi xác nhận DNS name và namespace của Service, trạng thái Endpoint, cấu hình DNS trong Pod, và log của CoreDNS để khoanh vùng lỗi.

Reference: Kiểm tra tên Service, namespace và DNS từ một pod bằng nslookup hoặc dig. Xem resolv.conf, CoreDNS logs/endpoints và kết nối UDP/TCP 53 hoặc NetworkPolicy. Sửa đúng nguyên nhân rồi thử phân giải và gọi Service lại.

- Query DNS
- CoreDNS/service namespace
- Connectivity and verify

Sources: https://www.rfc-editor.org/rfc/rfc1034

Metrics: {"sttMs":null,"providerFirstTokenMs":1077,"providerTotalMs":1737,"answerPreparationMs":2,"requestToFirstTokenMs":1088,"requestToCompletedMs":1745,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-10-1

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: How would you troubleshoot a pod in CrashLoopBackOff?

Transcript: not measured (text path or not run)

Answer: I’d scope affected replicas and user impact, preserving evidence before restarting or deleting anything; CrashLoopBackOff is a restart symptom, not the cause. I’d check `kubectl describe pod` for termination reasons, exit codes, and Events, then `kubectl logs --previous` for application failures. I’d inspect memory metrics, startup configuration, dependency connectivity, probes, and rollout history to distinguish OOM kills, startup failures, and liveness restarts; readiness failures don’t restart containers. I’d apply the smallest reversible fix supported by evidence, rolling back only with clear release correlation. If service is degraded, I’d contain impact using healthy replicas. Finally, I’d verify stable restart counts, readiness, endpoints, and service errors or latency, then add a regression check for the confirmed cause.

Reference: CrashLoopBackOff indicates repeated restarts with backoff, not a root cause. Inspect events, container termination state and previous logs. Check application configuration, dependencies, resources and probes; apply a targeted fix and verify restart count and service health.

- Events/termination state
- Previous logs
- Cause-specific remediation and verify

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":2193,"providerTotalMs":5715,"answerPreparationMs":2,"requestToFirstTokenMs":2211,"requestToCompletedMs":5731,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-11-1

Status: **completed**; quality: **needs_review**; screening: 0/100; reviewed score: n/a/100.

Question: Một pod ở trạng thái Pending lâu. Bạn xử lý như thế nào?

Transcript: not measured (text path or not run)

Answer: Pod ở trạng thái Pending lâu nghĩa là Kubernetes chưa thể gán Pod vào một node hoặc chưa hoàn tất bước chuẩn bị để chạy container. Trạng thái này chỉ cho biết Pod chưa chạy; cần xem sự kiện để xác định nguyên nhân cụ thể.

Reference: Xem kubectl describe pod và scheduler events trước. Kiểm tra requests so với capacity, taints/tolerations, affinity và PVC chưa bound. Điều chỉnh đúng ràng buộc hoặc bổ sung capacity rồi xác nhận pod Scheduled, Running và Ready.

- Scheduler events
- Resources and constraints
- Verify scheduling/readiness

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":1006,"providerTotalMs":1640,"answerPreparationMs":1,"requestToFirstTokenMs":1015,"requestToCompletedMs":1649,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-12-1

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Which kubectl commands would you use to check and roll back a Deployment rollout?

Transcript: not measured (text path or not run)

Answer: Start with `kubectl rollout status deployment/<name> -n <namespace>` to check whether the rollout completed or is stalled. Then use `kubectl rollout history deployment/<name> -n <namespace>` to inspect available revisions. If the current revision is unhealthy and the previous revision is known to be good, use `kubectl rollout undo deployment/<name> -n <namespace>`, then check rollout status again to confirm recovery.

Reference: Use kubectl rollout status deployment/NAME and kubectl rollout history deployment/NAME to inspect progress and revisions. If rollback is appropriate, use kubectl rollout undo deployment/NAME with a known revision, then verify readiness and application health. Database changes may need a separate recovery plan.

- Rollout status
- Rollout history
- Rollback and verify

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":1028,"providerTotalMs":1852,"answerPreparationMs":1,"requestToFirstTokenMs":1035,"requestToCompletedMs":1860,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-13-1

Status: **completed**; quality: **needs_review**; screening: 33/100; reviewed score: n/a/100.

Question: Container Kubernetes bị OOMKilled. Có nên tăng memory limit ngay không?

Transcript: not measured (text path or not run)

Answer: Không nên tăng memory limit ngay; OOMKilled chỉ cho biết container đã vượt giới hạn bộ nhớ và bị hệ thống kết thúc. Trước tiên cần xác định mức dùng bộ nhớ thực tế và nguyên nhân, vì tăng giới hạn có thể chỉ che giấu rò rỉ bộ nhớ hoặc gây áp lực lên node.

Reference: Xem termination reason, memory metrics và log để phân biệt tải tăng với memory leak hoặc cấu hình sai. So sánh requests/limits và capacity node. Tăng limit có kiểm soát khi có bằng chứng và capacity; kiểm chứng usage, restart và sức khỏe ứng dụng sau thay đổi.

- Thu thập bằng chứng memory
- Limit/capacity or leak
- Verify after change

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":1127,"providerTotalMs":1804,"answerPreparationMs":2,"requestToFirstTokenMs":1134,"requestToCompletedMs":1810,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-14-1

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Design a safe CI/CD deployment flow for a production API.

Transcript: not measured (text path or not run)

Answer: I’d use a gated, progressive deployment flow that limits production exposure and makes rollback predictable. CI runs tests and security checks, then publishes an immutable image digest. A restricted deployment identity promotes that same digest through staging into a Kubernetes canary, with readiness probes and traffic routing controlling exposure. Database changes use backward-compatible expand-and-contract migrations so the previous API version remains usable. Replicas span nodes, and runtime credentials stay outside images. Promotion requires acceptable error rate, latency, and successful API smoke tests; regression triggers rollback to the previous digest. Canary capacity adds cost, and database changes need separate recovery decisions because application rollback cannot safely undo every migration.

Reference: Build and test one immutable artifact, scan it, and promote the same version through environments. Use staged rollout with readiness and application checks. Monitor errors and latency; stop or roll back to a known good artifact when thresholds fail, accounting for database compatibility.

- Same immutable artifact
- Staged delivery and tests
- Verification and rollback

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":1304,"providerTotalMs":5895,"answerPreparationMs":2,"requestToFirstTokenMs":1313,"requestToCompletedMs":5904,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-15-1

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: GitLab CI khác Jenkins như thế nào, khi nào chọn mỗi công cụ?

Transcript: not measured (text path or not run)

Answer: GitLab CI tích hợp trực tiếp với GitLab để định nghĩa và chạy pipeline, còn Jenkins là máy chủ CI độc lập, có thể kết nối với nhiều hệ thống quản lý mã nguồn. Chọn GitLab CI khi muốn pipeline gắn liền với nền tảng GitLab; chọn Jenkins khi cần tính linh hoạt hoặc phải tích hợp với nhiều hệ thống khác nhau.

Reference: GitLab CI tích hợp pipeline với repository và dùng runners; Jenkins là automation server linh hoạt với plugin/agents và cần vận hành nhiều hơn. Chọn theo hệ sinh thái hiện có, nhu cầu tùy biến, bảo mật plugin và chi phí bảo trì, không chỉ số lượng tính năng.

- GitLab integration/runners
- Jenkins flexibility/plugins
- Operational choice

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":965,"providerTotalMs":1834,"answerPreparationMs":2,"requestToFirstTokenMs":973,"requestToCompletedMs":1843,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-16-1

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: An AWS access key was committed to a public Git repository. What should you do?

Transcript: not measured (text path or not run)

Answer: Immediately deactivate or delete the exposed access key; removing it from Git history does not make it safe. Then review CloudTrail for activity since exposure, investigate any unauthorized actions, and replace the key through your approved credential process.

Reference: Revoke or disable the exposed credential promptly and replace legitimate workloads with new credentials or roles. Investigate CloudTrail and access scope for abuse, preserve evidence and assess impact. Remove the secret from history and add scanning, but history cleanup alone does not revoke leaked copies.

- Revoke/rotate credential
- Investigate abuse
- History cleanup is insufficient

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":1556,"providerTotalMs":2342,"answerPreparationMs":2,"requestToFirstTokenMs":1563,"requestToCompletedMs":2437,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-17-1

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Áp dụng least privilege cho ứng dụng chạy trên AWS như thế nào?

Transcript: not measured (text path or not run)

Answer: Least privilege là nguyên tắc chỉ cấp cho ứng dụng những quyền AWS tối thiểu cần thiết để thực hiện chức năng của nó. Vì vậy, mỗi ứng dụng nên dùng IAM role với quyền giới hạn theo dịch vụ và tài nguyên, thay vì quyền rộng hoặc thông tin xác thực dùng chung.

Reference: Dùng IAM role và credential tạm thời cho workload. Chỉ cấp action/resource cần thiết, bổ sung conditions phù hợp; kiểm tra Access Analyzer/CloudTrail để thu hẹp quyền. Xác minh ứng dụng vẫn hoạt động và thao tác ngoài phạm vi bị từ chối, không dùng AdministratorAccess để chữa lỗi.

- Role/temporary credentials
- Actions/resources narrowly scoped
- Verify/access review

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":840,"providerTotalMs":1557,"answerPreparationMs":3,"requestToFirstTokenMs":851,"requestToCompletedMs":1568,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-18-1

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: As a senior DevOps engineer, design a highly available API on AWS and explain a trade-off.

Transcript: not measured (text path or not run)

Answer: I’d design the API across multiple Availability Zones so one zone’s failure doesn’t interrupt service, provided surviving capacity can handle the load. An Application Load Balancer routes traffic to stateless ECS tasks in private subnets, with autoscaling and health checks. RDS Multi-AZ provides database failover, though connections may briefly fail during promotion. TLS, least-privilege IAM, and security groups restrict access.

I’d deploy immutable image versions gradually, rolling back on elevated error rates or latency. CloudWatch tracks those signals alongside healthy task count. Multi-AZ increases cost, especially with spare capacity. I’d validate resilience by simulating task and database failures while measuring user-visible availability and recovery time.

Reference: Start from availability, RTO/RPO and load requirements. Spread stateless compute behind a load balancer across Availability Zones with health checks and autoscaling; choose a suitable database HA mode. State failover and cost/consistency trade-offs, use reversible deployments, and test failover against SLOs rather than promising zero downtime.

- Requirements/SLO/RTO
- Multiple AZ/failure domains
- Trade-off and failure verification

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":1480,"providerTotalMs":6239,"answerPreparationMs":1,"requestToFirstTokenMs":1489,"requestToCompletedMs":6247,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-19-1

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: SLI, SLO và SLA khác nhau như thế nào?

Transcript: not measured (text path or not run)

Answer: Khác biệt cốt lõi là SLI đo lường, SLO đặt mục tiêu nội bộ, còn SLA là cam kết với khách hàng. SLI có thể là tỷ lệ yêu cầu thành công; SLO quy định tỷ lệ đó cần đạt mức nào trong một khoảng thời gian. SLA thường gắn với hậu quả hoặc khoản bồi hoàn nếu không đạt. SLO giúp đội vận hành quản lý độ tin cậy và cân bằng tốc độ phát hành với rủi ro; SLA tạo trách nhiệm với khách hàng nhưng có thể kéo theo chi phí khi vi phạm. Hãy dùng SLI để theo dõi, SLO để điều hành dịch vụ, và SLA khi cần cam kết rõ ràng với khách hàng.

Reference: SLI là chỉ số đo trải nghiệm dịch vụ, ví dụ tỷ lệ request thành công. SLO là mục tiêu cho chỉ số đó trong một cửa sổ thời gian. SLA là cam kết với khách hàng, thường có hậu quả hợp đồng khi vi phạm; ba khái niệm không đồng nghĩa.

- SLI measurement
- SLO objective/window
- SLA agreement/consequence

Sources: https://sre.google/sre-book/service-level-objectives/

Metrics: {"sttMs":null,"providerFirstTokenMs":1381,"providerTotalMs":2741,"answerPreparationMs":2,"requestToFirstTokenMs":1390,"requestToCompletedMs":2749,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-20-1

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: How would you reduce noisy Prometheus alerts without hiding real incidents?

Transcript: not measured (text path or not run)

Answer: I’d tune alerts around actionable user impact, rather than simply raising thresholds or disabling rules. First, I’d review firing history and identify alerts that flap, duplicate others, or require no action. I’d change one noisy rule at a time, adding a suitable `for` duration for transient spikes while keeping critical outage detection fast. In Alertmanager, I’d group related notifications and inhibit downstream alerts only when a confirmed upstream alert explains them.

The trade-off is slower detection or suppressed independent failures. I’d validate against previous incidents and controlled failures, comparing notification volume and detection time, and revert changes that miss actionable incidents.

Reference: Prefer actionable user-impact or SLO-based alerts, with meaningful duration and thresholds. Use Alertmanager grouping, deduplication and inhibition for related symptoms. Validate rules against incidents and test recovery; avoid silencing everything or using CPU alone as a universal paging signal.

- User impact/SLO
- Duration/grouping/deduplication
- Verify alert behavior

Sources: https://prometheus.io/docs/practices/alerting/

Metrics: {"sttMs":null,"providerFirstTokenMs":1247,"providerTotalMs":5008,"answerPreparationMs":2,"requestToFirstTokenMs":1255,"requestToCompletedMs":5016,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-21-1

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Idempotency trong Ansible nghĩa là gì?

Transcript: not measured (text path or not run)

Answer: Idempotency trong Ansible nghĩa là chạy một playbook nhiều lần vẫn đưa hệ thống về cùng trạng thái mong muốn, thay vì lặp lại thay đổi không cần thiết. Nhờ đó, có thể chạy lại playbook an toàn khi cần mà không làm phát sinh thay đổi ngoài ý muốn.

Reference: Chạy lại cùng cấu hình nhiều lần vẫn hội tụ về trạng thái mong muốn mà không tạo thêm thay đổi không cần thiết. Ưu tiên module khai báo trạng thái; command hoặc shell không tự bảo đảm idempotency nếu không có điều kiện bảo vệ.

- Repeated convergence
- Desired state/no extra changes
- Module vs shell caveat

Sources: https://docs.ansible.com/ansible/latest/reference_appendices/glossary.html

Metrics: {"sttMs":null,"providerFirstTokenMs":910,"providerTotalMs":1550,"answerPreparationMs":2,"requestToFirstTokenMs":920,"requestToCompletedMs":1559,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-22-1

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: A service fails TLS certificate validation. How do you investigate safely?

Transcript: not measured (text path or not run)

Answer: I’d first confirm which clients and endpoints are affected and preserve the exact validation error. Then check the certificate chain, hostname, validity dates, and client trust store to isolate the cause before changing anything. I’d verify recovery with a client-side TLS check and a successful service request.

Reference: Inspect certificate validity dates, hostname/SAN and the full certificate chain using an appropriate TLS client. Check trust store, SNI and client clock. Repair the certificate or trust configuration and verify validation succeeds; disabling verification is not a production fix.

- Expiry/hostname/chain
- Trust store/SNI/clock
- Verify securely

Sources: https://www.rfc-editor.org/rfc/rfc8446

Metrics: {"sttMs":null,"providerFirstTokenMs":2132,"providerTotalMs":2673,"answerPreparationMs":1,"requestToFirstTokenMs":2243,"requestToCompletedMs":2682,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-23-1

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Terraform plan bất ngờ muốn destroy database production. Bạn làm gì?

Transcript: not measured (text path or not run)

Answer: Tôi sẽ dừng việc apply ngay, vì Terraform plan chỉ dự kiến thay đổi chứ chưa thực thi. Tôi kiểm tra diff và state để xác định vì sao database bị đánh dấu destroy; nếu chưa rõ nguyên nhân, tôi giữ nguyên production và chỉ tiếp tục khi đã xác nhận kế hoạch an toàn.

Reference: Dừng apply và giữ lại plan/state để điều tra. Kiểm tra workspace, backend, cấu hình, resource address, drift và thay đổi provider. Xác nhận backup/restore và dùng biện pháp migration/import phù hợp, review lại plan trước khi cho phép thay đổi; không force apply hay xóa state tùy tiện.

- Stop/review apply
- State/workspace/backend diagnosis
- Backup/recovery/change safety

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":741,"providerTotalMs":1542,"answerPreparationMs":5,"requestToFirstTokenMs":759,"requestToCompletedMs":1560,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-24-1

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: A Kafka consumer processes the same payment event twice. How would you prevent duplicate effects?

Transcript: not measured (text path or not run)

Answer: I’d make payment processing idempotent, because Kafka can redeliver events even when offset handling is correct. First, I’d check the event ID and offset history to distinguish redelivery from two separately published events. Then I’d use a stable payment operation ID and atomically record it with the payment update in one database transaction, enforced by a unique constraint. I’d commit the Kafka offset only after that transaction succeeds. For an external payment API, I’d pass the same idempotency key, provided the API supports it. This adds storage and retention overhead. I’d validate by replaying events and crashing before offset commit, confirming only one charge occurs.

Reference: Treat retries and redelivery as expected under at-least-once processing. Use a stable event or payment id and durable idempotency/deduplication around the side effect. Coordinate commit ordering and transactional/outbox patterns as appropriate; verify replay safety. Kafka transactions alone do not guarantee exactly-once effects in an external payment system.

- Redelivery/offset relationship
- Durable dedup/idempotency
- External side effects caveat/verification

Sources: https://kafka.apache.org/documentation/#semantics

Metrics: {"sttMs":null,"providerFirstTokenMs":1270,"providerTotalMs":4544,"answerPreparationMs":2,"requestToFirstTokenMs":1286,"requestToCompletedMs":4557,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-25-1

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Một microservice gọi downstream chậm và gây timeout dây chuyền. Bạn xử lý thế nào?

Transcript: not measured (text path or not run)

Answer: Tôi sẽ khoanh vùng ảnh hưởng và giữ lại trace, log, metric trước khi thay đổi cấu hình. Sau đó đối chiếu thời gian chờ, tỷ lệ lỗi và độ trễ của downstream để xác định điểm nghẽn; nếu ảnh hưởng tăng, tôi giới hạn lưu lượng hoặc rollback thay đổi gần nhất thay vì khởi động lại hàng loạt. Khi đã xác định nguyên nhân, tôi điều chỉnh timeout và giới hạn concurrency phù hợp, có thể dùng circuit breaker để ngăn lời gọi tiếp tục làm cạn tài nguyên. Cuối cùng, xác nhận độ trễ và lỗi đã giảm ở cả service lẫn phía người dùng.

Reference: Xác định dependency gây chậm bằng traces, latency và saturation. Giới hạn timeout theo deadline tổng, retry có giới hạn/backoff cho thao tác an toàn, dùng circuit breaker hoặc bulkhead để chặn lan truyền. Giảm tải có kiểm soát rồi xác minh error rate và p95/p99, tránh retry storm.

- Evidence/trace
- Timeout and bounded retries
- Containment and verify

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":936,"providerTotalMs":2579,"answerPreparationMs":3,"requestToFirstTokenMs":945,"requestToCompletedMs":2587,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-26-1

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Are Kubernetes Secrets secure just because their values are base64 encoded?

Transcript: not measured (text path or not run)

Answer: No. Base64 is only an encoding, not encryption, so anyone who can read a Kubernetes Secret can decode its values; access controls and encryption at rest provide the security.

Reference: No. Base64 is encoding, not encryption. Restrict Secret access with RBAC and workload identities, enable appropriate encryption at rest, and protect transport and logs. Rotate exposed secrets and consider an external secret manager; verify access boundaries.

- Encoding is not encryption
- Access restriction
- Encryption/rotation/secret manager

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":880,"providerTotalMs":1378,"answerPreparationMs":1,"requestToFirstTokenMs":889,"requestToCompletedMs":1384,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-27-1

Status: **completed**; quality: **needs_review**; screening: 33/100; reviewed score: n/a/100.

Question: Hãy kể một sự cố production bạn đã trực tiếp xử lý với vai trò DevOps.

Transcript: not measured (text path or not run)

Answer: Bạn có thể trả lời theo cấu trúc này, thay các phần trong ngoặc bằng trải nghiệm có thật: “Tôi từng trực tiếp xử lý sự cố [mô tả ngắn], ảnh hưởng đến [dịch vụ hoặc người dùng]. Tôi xác định nguyên nhân là [nguyên nhân] qua [tín hiệu kiểm tra], rồi [biện pháp khắc phục]. Sau đó, tôi xác nhận dịch vụ hoạt động lại bằng [chỉ số hoặc kiểm tra người dùng] và bổ sung [biện pháp phòng ngừa].”

Reference: Khi chưa có hồ sơ xác thực, trả một khung Adaptable answer với Situation, Task, Action, Result và chỗ trống để ứng viên điền sự kiện thật. Không tự nhận đã xử lý một sự cố hay bịa công ty, số liệu và kết quả.

- Adaptable label
- STAR outline
- Placeholders/no invented incident

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":836,"providerTotalMs":2008,"answerPreparationMs":1,"requestToFirstTokenMs":845,"requestToCompletedMs":2015,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-28-1

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Tell me about your CI/CD experience based on the attached profile.

Transcript: not measured (text path or not run)

Answer: My CI/CD experience comes from building a GitLab CI pipeline for a personal Docker API practice project. The task was to automate testing and provide a controlled way to deploy to staging. I added unit tests and a manual staging deployment step, keeping deployment as an explicit action rather than an automatic change. The concrete result was a practice pipeline with automated tests and manual staging deployment. That is the extent of my verified hands-on experience; I do not have measured business results or production incident ownership to claim.

Reference: Use only the supplied practice-project facts: built a GitLab CI pipeline for a personal Docker API, added tests and a manual staging deployment. Describe those actions and learning without claiming production ownership, employers or measured business improvements.

- GitLab practice project
- Tests/staging/manual deploy
- No invented production ownership

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":1901,"providerTotalMs":4129,"answerPreparationMs":2,"requestToFirstTokenMs":1908,"requestToCompletedMs":4135,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-29-1

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: What if CPU requests are missing?

Transcript: not measured (text path or not run)

Answer: If CPU requests are missing, the HPA cannot calculate CPU utilization as a percentage of the requested CPU, so CPU-based scaling will not work for those pods. It needs CPU requests defined to use that metric.

Reference: In the preceding CPU-utilization HPA context, utilization is defined relative to CPU requests. Without relevant requests it cannot calculate that metric as intended. Set appropriate requests, confirm metrics availability and inspect HPA conditions; other metric types have different prerequisites.

- CPU utilization relative to requests
- Cannot calculate/missing metric
- Verify HPA/metrics

Sources: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/

Metrics: {"sttMs":null,"providerFirstTokenMs":1952,"providerTotalMs":2913,"answerPreparationMs":2,"requestToFirstTokenMs":1963,"requestToCompletedMs":2937,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-30-1

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Nếu bản rollout đó có migration database không tương thích thì sao?

Transcript: not measured (text path or not run)

Answer: Nếu migration database không tương thích ngược, rollback Deployment có thể không khôi phục được dịch vụ vì phiên bản cũ có thể không đọc được schema mới; vì vậy cần xử lý tương thích schema trước khi rollback.

Reference: Rollback Deployment chỉ đổi phiên bản workload, không tự phục hồi schema hoặc dữ liệu. Dừng rollout, đánh giá tương thích và chọn forward fix hoặc khôi phục đã được kiểm thử theo RPO/RTO. Ưu tiên expand/contract cho lần sau và xác minh dữ liệu cùng ứng dụng.

- Rollback does not restore schema
- Recovery/forward fix/compatibility
- Verify/RPO/RTO

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":1083,"providerTotalMs":1578,"answerPreparationMs":2,"requestToFirstTokenMs":1094,"requestToCompletedMs":1589,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-01-2

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Docker là gì?

Transcript: not measured (text path or not run)

Answer: Docker là nền tảng dùng để đóng gói ứng dụng cùng các thành phần cần thiết và chạy chúng trong container. Image là gói chỉ đọc làm khuôn để tạo container; container là ứng dụng đang chạy từ image đó.

Reference: Docker đóng gói ứng dụng cùng phụ thuộc thành image và chạy thành container. Container là tiến trình được cô lập và chia sẻ kernel của host; image là khuôn đóng gói, khác với container đang chạy.

- Đóng gói ứng dụng và phụ thuộc
- Phân biệt image và container
- Cô lập tiến trình

Sources: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/

Metrics: {"sttMs":null,"providerFirstTokenMs":1140,"providerTotalMs":1760,"answerPreparationMs":2,"requestToFirstTokenMs":1146,"requestToCompletedMs":1768,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-02-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: What is the difference between a Docker image and a container?

Transcript: not measured (text path or not run)

Answer: A Docker image is a packaged, read-only layered artifact, while a container is a running, isolated instance of that image. Operationally, multiple containers can use the same image but have separate writable layers and runtime state; changes inside a container don’t change the original image. Choose an image when you need a reusable, consistent package, and a container when you need to run that package. The trade-off is that container-local changes are temporary and aren’t a reliable way to update the image.

Reference: An image is a packaged, read-only template. A container is an instance created from it, with a writable layer and process lifecycle. Containers can be stopped; an existing image is not modified by writing inside one.

- Image là template
- Container là instance
- Writable layer hoặc lifecycle

Sources: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/

Metrics: {"sttMs":null,"providerFirstTokenMs":1909,"providerTotalMs":2414,"answerPreparationMs":2,"requestToFirstTokenMs":1918,"requestToCompletedMs":2422,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-03-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Kubernetes HPA là gì?

Transcript: not measured (text path or not run)

Answer: HPA, hay Horizontal Pod Autoscaler, là cơ chế trong Kubernetes tự động điều chỉnh số lượng Pod của workload dựa trên các chỉ số được cấu hình. HPA thay đổi số Pod, không tự điều chỉnh tài nguyên CPU hoặc bộ nhớ cấp cho từng Pod.

Reference: HPA điều chỉnh số replica của workload dựa trên metrics như CPU, memory hoặc custom metrics. Nó scale pod theo chiều ngang; không tự tăng số node. Với CPU utilization, cần resource requests và nguồn metrics phù hợp.

- Scale replica/pod
- Dựa trên metrics
- Phân biệt node scaling

Sources: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/

Metrics: {"sttMs":null,"providerFirstTokenMs":946,"providerTotalMs":1562,"answerPreparationMs":1,"requestToFirstTokenMs":953,"requestToCompletedMs":1567,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-04-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: How do readiness and liveness probes differ in Kubernetes?

Transcript: not measured (text path or not run)

Answer: A readiness probe determines whether a container is ready to receive traffic; a liveness probe determines whether it should be restarted. A failed readiness check removes the pod from service endpoints, while a failed liveness check triggers a restart.

Reference: Readiness controls whether a pod receives service traffic. Liveness failures can restart a container. Startup probes protect slow initialization. A downstream dependency failure should not automatically trigger a restart loop; choose probe conditions and thresholds carefully.

- Readiness controls traffic
- Liveness restarts container
- Phân biệt failure action

Sources: https://kubernetes.io/docs/concepts/workloads/pods/probes/

Metrics: {"sttMs":null,"providerFirstTokenMs":969,"providerTotalMs":1399,"answerPreparationMs":2,"requestToFirstTokenMs":979,"requestToCompletedMs":1406,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-05-2

Status: **completed**; quality: **needs_review**; screening: 33/100; reviewed score: n/a/100.

Question: Terraform state dùng để làm gì?

Transcript: not measured (text path or not run)

Answer: Terraform state dùng để ghi nhận các tài nguyên hạ tầng mà Terraform quản lý và ánh xạ chúng với cấu hình trong mã. Nhờ đó, Terraform xác định trạng thái hiện tại để biết cần tạo, cập nhật hay xóa tài nguyên.

Reference: State ánh xạ cấu hình Terraform tới tài nguyên thực và lưu metadata phục vụ plan. State có thể chứa dữ liệu nhạy cảm nên cần bảo vệ, backup, và dùng remote backend có locking phù hợp cho nhóm.

- Ánh xạ tài nguyên
- Plan hoặc metadata
- Bảo vệ state

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":835,"providerTotalMs":1499,"answerPreparationMs":1,"requestToFirstTokenMs":841,"requestToCompletedMs":1506,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-06-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Compare Terraform and AWS CloudFormation. When would you choose each?

Transcript: not measured (text path or not run)

Answer: Terraform uses a provider-based model to manage resources across multiple platforms, while CloudFormation is AWS-native and models AWS resources through stacks. Terraform offers broader portability and a consistent workflow, but adds provider and state management; CloudFormation integrates directly with AWS, but ties infrastructure definitions to AWS. I’d choose Terraform when managing multiple providers or needing one IaC workflow across them, accepting the extra state operations. I’d choose CloudFormation for AWS-only infrastructure where native integration and fewer external dependencies matter, accepting less portability.

Reference: Terraform uses providers and supports multiple platforms, while CloudFormation is AWS-native and manages stacks through AWS. Choose based on platform coverage, team skills, state/stack operations, and integration needs; neither automatically eliminates drift or deployment risk.

- Terraform providers/platforms
- CloudFormation AWS-native
- Choice and trade-off

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":846,"providerTotalMs":2301,"answerPreparationMs":2,"requestToFirstTokenMs":854,"requestToCompletedMs":2308,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-07-2

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Một commit lỗi đã được push lên nhánh chung. Nên dùng git revert hay reset?

Transcript: not measured (text path or not run)

Answer: Với commit lỗi đã được push lên nhánh chung, nên dùng `git revert` để tạo commit mới đảo ngược các thay đổi của commit đó. Khác với `reset`, `revert` giữ nguyên lịch sử đã chia sẻ và tránh viết lại lịch sử nhánh.

Reference: Ưu tiên git revert để tạo commit đảo thay đổi mà không viết lại lịch sử dùng chung. Kiểm tra commit và chạy test trước khi merge/push. Reset phù hợp hơn với lịch sử local; force push nhánh chung cần quy trình phối hợp riêng.

- Ưu tiên revert
- Giữ lịch sử dùng chung
- Kiểm tra kết quả

Sources: https://git-scm.com/docs/git-revert

Metrics: {"sttMs":null,"providerFirstTokenMs":1292,"providerTotalMs":1949,"answerPreparationMs":1,"requestToFirstTokenMs":1300,"requestToCompletedMs":1956,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-08-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: A Linux server reports disk full, but du shows little usage. How do you investigate?

Transcript: not measured (text path or not run)

Answer: I’d first confirm which filesystem is affected and whether users or services are impacted, then compare `df -hT` with `df -i` to distinguish space from inode exhaustion. If `df` shows high usage but `du` does not, I’d check for deleted files still held open with `lsof +L1`; I’d identify the owning process before taking action, then verify filesystem availability and the service’s user-visible health.

Reference: Compare filesystem space and inode usage with df -h and df -i. Check mount boundaries and deleted-but-open files using lsof +L1. Release space through a controlled log rotation or process action; verify capacity and service health rather than deleting files blindly.

- Filesystem/inodes
- Deleted open files
- Safe mitigation and verification

Sources: https://man7.org/linux/man-pages/man1/df.1.html

Metrics: {"sttMs":null,"providerFirstTokenMs":2276,"providerTotalMs":3169,"answerPreparationMs":2,"requestToFirstTokenMs":2283,"requestToCompletedMs":3175,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-09-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Pod Kubernetes không resolve được DNS của một Service. Bạn kiểm tra gì?

Transcript: not measured (text path or not run)

Answer: Trước tiên, tôi xác định phạm vi ảnh hưởng và giữ lại log, rồi kiểm tra DNS từ Pod: xem cấu hình resolver trong `/etc/resolv.conf` và thử phân giải tên Service đầy đủ. Nếu thất bại, tôi kiểm tra trạng thái Pod CoreDNS và log để phân biệt lỗi DNS với lỗi mạng hoặc cấu hình Service; chỉ thay đổi hay khởi động lại sau khi có bằng chứng. Sau xử lý, tôi xác nhận Pod phân giải được tên và Service truy cập được.

Reference: Kiểm tra tên Service, namespace và DNS từ một pod bằng nslookup hoặc dig. Xem resolv.conf, CoreDNS logs/endpoints và kết nối UDP/TCP 53 hoặc NetworkPolicy. Sửa đúng nguyên nhân rồi thử phân giải và gọi Service lại.

- Query DNS
- CoreDNS/service namespace
- Connectivity and verify

Sources: https://www.rfc-editor.org/rfc/rfc1034

Metrics: {"sttMs":null,"providerFirstTokenMs":1046,"providerTotalMs":2178,"answerPreparationMs":1,"requestToFirstTokenMs":1057,"requestToCompletedMs":2185,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-10-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: How would you troubleshoot a pod in CrashLoopBackOff?

Transcript: not measured (text path or not run)

Answer: I’d check user impact and affected replicas, then preserve evidence before restarting anything; CrashLoopBackOff is a restart-backoff symptom, not the cause. I’d inspect `kubectl describe pod`, Events, and the termination reason and exit code for OOM kills or startup failures, then `kubectl logs --previous` for configuration, dependency, or DNS errors. I’d check probes: liveness can restart containers; readiness only removes them from endpoints. I’d apply the smallest reversible fix, rolling back only if failures clearly correlate with a release. Finally, I’d verify stable restart counts, restored readiness and endpoints, and normal service errors and latency, then add a regression check for the confirmed cause.

Reference: CrashLoopBackOff indicates repeated restarts with backoff, not a root cause. Inspect events, container termination state and previous logs. Check application configuration, dependencies, resources and probes; apply a targeted fix and verify restart count and service health.

- Events/termination state
- Previous logs
- Cause-specific remediation and verify

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":1890,"providerTotalMs":4780,"answerPreparationMs":1,"requestToFirstTokenMs":1897,"requestToCompletedMs":4786,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-11-2

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Một pod ở trạng thái Pending lâu. Bạn xử lý như thế nào?

Transcript: not measured (text path or not run)

Answer: Tôi xác định phạm vi ảnh hưởng và giữ nguyên trạng thái để thu thập bằng chứng trước khi thay đổi. Sau đó, tôi kiểm tra `kubectl describe pod` và sự kiện gần nhất để phân biệt nguyên nhân như thiếu tài nguyên, lỗi lập lịch hay không tải được image; chỉ khắc phục theo nguyên nhân đã xác nhận, rồi kiểm tra pod chuyển sang `Running` và dịch vụ hoạt động trở lại.

Reference: Xem kubectl describe pod và scheduler events trước. Kiểm tra requests so với capacity, taints/tolerations, affinity và PVC chưa bound. Điều chỉnh đúng ràng buộc hoặc bổ sung capacity rồi xác nhận pod Scheduled, Running và Ready.

- Scheduler events
- Resources and constraints
- Verify scheduling/readiness

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":836,"providerTotalMs":1771,"answerPreparationMs":2,"requestToFirstTokenMs":844,"requestToCompletedMs":1779,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-12-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Which kubectl commands would you use to check and roll back a Deployment rollout?

Transcript: not measured (text path or not run)

Answer: I’d first inspect the rollout status and recent revisions with `kubectl rollout status deployment/<name> -n <namespace>` and `kubectl rollout history deployment/<name> -n <namespace>`. The status shows whether the rollout completed or is stuck; the history shows available revisions. If the current rollout is unhealthy and the previous revision is known to be good, use `kubectl rollout undo deployment/<name> -n <namespace>`, then check `rollout status` again to confirm recovery.

Reference: Use kubectl rollout status deployment/NAME and kubectl rollout history deployment/NAME to inspect progress and revisions. If rollback is appropriate, use kubectl rollout undo deployment/NAME with a known revision, then verify readiness and application health. Database changes may need a separate recovery plan.

- Rollout status
- Rollout history
- Rollback and verify

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":1400,"providerTotalMs":2367,"answerPreparationMs":2,"requestToFirstTokenMs":1407,"requestToCompletedMs":2373,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-13-2

Status: **completed**; quality: **needs_review**; screening: 33/100; reviewed score: n/a/100.

Question: Container Kubernetes bị OOMKilled. Có nên tăng memory limit ngay không?

Transcript: not measured (text path or not run)

Answer: Không nên tăng memory limit ngay; trước tiên cần xác định container có thực sự thiếu giới hạn bộ nhớ hay chỉ tăng bộ nhớ bất thường do rò rỉ hoặc tải đột biến. Tăng limit có thể giảm việc bị kill tạm thời, nhưng cũng có thể làm node cạn bộ nhớ và ảnh hưởng workload khác.

Reference: Xem termination reason, memory metrics và log để phân biệt tải tăng với memory leak hoặc cấu hình sai. So sánh requests/limits và capacity node. Tăng limit có kiểm soát khi có bằng chứng và capacity; kiểm chứng usage, restart và sức khỏe ứng dụng sau thay đổi.

- Thu thập bằng chứng memory
- Limit/capacity or leak
- Verify after change

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":1360,"providerTotalMs":2231,"answerPreparationMs":2,"requestToFirstTokenMs":1369,"requestToCompletedMs":2238,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-14-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Design a safe CI/CD deployment flow for a production API.

Transcript: not measured (text path or not run)

Answer: I’d use a build-once, progressively promoted deployment flow that limits production exposure and supports rollback. CI runs tests and security scans, then publishes an immutable image digest. A restricted deployment identity promotes that digest to Kubernetes; production secrets remain outside build artifacts. Readiness probes gate traffic, and a canary receives limited traffic before wider rollout. Database changes use backward-compatible expand-and-contract migrations so the previous API version remains usable. I’d pause promotion or roll back the image if error rate or latency breaches defined thresholds, then verify recovery with synthetic API requests. Canary capacity adds cost, but reduces deployment blast radius; destructive schema changes require separate approval.

Reference: Build and test one immutable artifact, scan it, and promote the same version through environments. Use staged rollout with readiness and application checks. Monitor errors and latency; stop or roll back to a known good artifact when thresholds fail, accounting for database compatibility.

- Same immutable artifact
- Staged delivery and tests
- Verification and rollback

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":1499,"providerTotalMs":6070,"answerPreparationMs":2,"requestToFirstTokenMs":1508,"requestToCompletedMs":6078,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-15-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: GitLab CI khác Jenkins như thế nào, khi nào chọn mỗi công cụ?

Transcript: not measured (text path or not run)

Answer: GitLab CI được tích hợp sẵn trong GitLab, còn Jenkins là máy chủ CI độc lập, có thể kết nối với nhiều nền tảng mã nguồn khác nhau. Chọn GitLab CI khi mã nguồn đã ở GitLab và muốn hệ thống gọn; chọn Jenkins khi cần tính linh hoạt hoặc tích hợp với nhiều công cụ hiện có.

Reference: GitLab CI tích hợp pipeline với repository và dùng runners; Jenkins là automation server linh hoạt với plugin/agents và cần vận hành nhiều hơn. Chọn theo hệ sinh thái hiện có, nhu cầu tùy biến, bảo mật plugin và chi phí bảo trì, không chỉ số lượng tính năng.

- GitLab integration/runners
- Jenkins flexibility/plugins
- Operational choice

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":973,"providerTotalMs":1865,"answerPreparationMs":2,"requestToFirstTokenMs":981,"requestToCompletedMs":1872,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-16-2

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: An AWS access key was committed to a public Git repository. What should you do?

Transcript: not measured (text path or not run)

Answer: Immediately deactivate and delete the exposed access key; removing it from the repository does not make it safe. Replace it with a new credential, review CloudTrail for unauthorized use, and remove the secret from the repository’s history.

Reference: Revoke or disable the exposed credential promptly and replace legitimate workloads with new credentials or roles. Investigate CloudTrail and access scope for abuse, preserve evidence and assess impact. Remove the secret from history and add scanning, but history cleanup alone does not revoke leaked copies.

- Revoke/rotate credential
- Investigate abuse
- History cleanup is insufficient

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":1891,"providerTotalMs":2454,"answerPreparationMs":1,"requestToFirstTokenMs":1899,"requestToCompletedMs":2461,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-17-2

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Áp dụng least privilege cho ứng dụng chạy trên AWS như thế nào?

Transcript: not measured (text path or not run)

Answer: Least privilege là chỉ cấp cho ứng dụng quyền AWS tối thiểu cần thiết để thực hiện nhiệm vụ của nó. Tôi áp dụng bằng cách gắn IAM role với quyền giới hạn theo hành động và tài nguyên, thay vì dùng quyền rộng như `*`.

Reference: Dùng IAM role và credential tạm thời cho workload. Chỉ cấp action/resource cần thiết, bổ sung conditions phù hợp; kiểm tra Access Analyzer/CloudTrail để thu hẹp quyền. Xác minh ứng dụng vẫn hoạt động và thao tác ngoài phạm vi bị từ chối, không dùng AdministratorAccess để chữa lỗi.

- Role/temporary credentials
- Actions/resources narrowly scoped
- Verify/access review

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":1859,"providerTotalMs":2544,"answerPreparationMs":3,"requestToFirstTokenMs":1870,"requestToCompletedMs":2554,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-18-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: As a senior DevOps engineer, design a highly available API on AWS and explain a trade-off.

Transcript: not measured (text path or not run)

Answer: I’d recommend a multi-AZ architecture that keeps API compute stateless and redundant, with database failover within one AWS Region. An Application Load Balancer routes traffic to ECS tasks across two Availability Zones, while RDS Multi-AZ provides database redundancy. Tasks and the database stay in private subnets, with security groups restricting access and IAM roles granting least privilege. Health checks remove unhealthy tasks, and clients retry transient database failures with backoff. I’d deploy immutable image versions gradually, rolling back on elevated errors or latency. CloudWatch alarms and an AZ-failure exercise validate availability. The trade-off is higher redundancy cost, and this design does not cover a regional outage.

Reference: Start from availability, RTO/RPO and load requirements. Spread stateless compute behind a load balancer across Availability Zones with health checks and autoscaling; choose a suitable database HA mode. State failover and cost/consistency trade-offs, use reversible deployments, and test failover against SLOs rather than promising zero downtime.

- Requirements/SLO/RTO
- Multiple AZ/failure domains
- Trade-off and failure verification

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":1149,"providerTotalMs":5032,"answerPreparationMs":2,"requestToFirstTokenMs":1156,"requestToCompletedMs":5039,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-19-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: SLI, SLO và SLA khác nhau như thế nào?

Transcript: not measured (text path or not run)

Answer: Điểm khác biệt chính là SLI đo lường, SLO đặt mục tiêu nội bộ, còn SLA là cam kết với khách hàng. SLI là chỉ số như tỷ lệ request thành công; SLO xác định mức cần đạt trong một khoảng thời gian; SLA quy định hậu quả hoặc bồi thường nếu không đạt. SLO giúp đội vận hành quản lý độ tin cậy mà vẫn giữ dư địa cho thay đổi, nhưng cần chọn chỉ số phản ánh trải nghiệm người dùng. Hãy dùng SLI để theo dõi, SLO để điều hành, và SLA khi cần cam kết có ràng buộc với khách hàng.

Reference: SLI là chỉ số đo trải nghiệm dịch vụ, ví dụ tỷ lệ request thành công. SLO là mục tiêu cho chỉ số đó trong một cửa sổ thời gian. SLA là cam kết với khách hàng, thường có hậu quả hợp đồng khi vi phạm; ba khái niệm không đồng nghĩa.

- SLI measurement
- SLO objective/window
- SLA agreement/consequence

Sources: https://sre.google/sre-book/service-level-objectives/

Metrics: {"sttMs":null,"providerFirstTokenMs":2585,"providerTotalMs":3926,"answerPreparationMs":1,"requestToFirstTokenMs":2591,"requestToCompletedMs":3930,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-20-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: How would you reduce noisy Prometheus alerts without hiding real incidents?

Transcript: not measured (text path or not run)

Answer: I’d reduce noise by making alerts reflect actionable service impact, while preserving coverage for real incidents. First, I’d review recent alerts for duplicates, flapping, and pages that required no action. Then I’d tune one alert group at a time: add a `for` duration for transient spikes, group related notifications in Alertmanager, and inhibit downstream symptom alerts only when a clear parent failure is firing. Lower-urgency signals can remain non-paging alerts.

The trade-off is slower detection or suppressed context, so I’d validate changes against known incident timelines and monitor page volume, actionable-page percentage, and detection delay before expanding them.

Reference: Prefer actionable user-impact or SLO-based alerts, with meaningful duration and thresholds. Use Alertmanager grouping, deduplication and inhibition for related symptoms. Validate rules against incidents and test recovery; avoid silencing everything or using CPU alone as a universal paging signal.

- User impact/SLO
- Duration/grouping/deduplication
- Verify alert behavior

Sources: https://prometheus.io/docs/practices/alerting/

Metrics: {"sttMs":null,"providerFirstTokenMs":1777,"providerTotalMs":5844,"answerPreparationMs":1,"requestToFirstTokenMs":1784,"requestToCompletedMs":5850,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-21-2

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Idempotency trong Ansible nghĩa là gì?

Transcript: not measured (text path or not run)

Answer: Idempotency trong Ansible nghĩa là khi chạy cùng một playbook nhiều lần, hệ thống chỉ thay đổi những gì chưa đúng trạng thái khai báo; nếu đã đúng, lần chạy tiếp theo sẽ không tạo thêm thay đổi.

Reference: Chạy lại cùng cấu hình nhiều lần vẫn hội tụ về trạng thái mong muốn mà không tạo thêm thay đổi không cần thiết. Ưu tiên module khai báo trạng thái; command hoặc shell không tự bảo đảm idempotency nếu không có điều kiện bảo vệ.

- Repeated convergence
- Desired state/no extra changes
- Module vs shell caveat

Sources: https://docs.ansible.com/ansible/latest/reference_appendices/glossary.html

Metrics: {"sttMs":null,"providerFirstTokenMs":976,"providerTotalMs":1579,"answerPreparationMs":2,"requestToFirstTokenMs":984,"requestToCompletedMs":1586,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-22-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: A service fails TLS certificate validation. How do you investigate safely?

Transcript: not measured (text path or not run)

Answer: I’d first scope which clients and endpoints are affected and preserve the TLS error details. Then I’d check the certificate’s hostname, validity dates, presented chain, client trust store, and system clock—in that order. I wouldn’t disable validation; I’d verify recovery with certificate checks still enabled.

Reference: Inspect certificate validity dates, hostname/SAN and the full certificate chain using an appropriate TLS client. Check trust store, SNI and client clock. Repair the certificate or trust configuration and verify validation succeeds; disabling verification is not a production fix.

- Expiry/hostname/chain
- Trust store/SNI/clock
- Verify securely

Sources: https://www.rfc-editor.org/rfc/rfc8446

Metrics: {"sttMs":null,"providerFirstTokenMs":2235,"providerTotalMs":2841,"answerPreparationMs":1,"requestToFirstTokenMs":2241,"requestToCompletedMs":2847,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-23-2

Status: **completed**; quality: **needs_review**; screening: 33/100; reviewed score: n/a/100.

Question: Terraform plan bất ngờ muốn destroy database production. Bạn làm gì?

Transcript: not measured (text path or not run)

Answer: Tôi sẽ chặn áp dụng thay đổi ngay, vì `terraform plan` chưa thay đổi hạ tầng. Tôi kiểm tra phần diff để xác định vì sao Terraform đề xuất xóa database; chỉ tiếp tục khi đã xác nhận đúng nguyên nhân và phương án bảo vệ dữ liệu production.

Reference: Dừng apply và giữ lại plan/state để điều tra. Kiểm tra workspace, backend, cấu hình, resource address, drift và thay đổi provider. Xác nhận backup/restore và dùng biện pháp migration/import phù hợp, review lại plan trước khi cho phép thay đổi; không force apply hay xóa state tùy tiện.

- Stop/review apply
- State/workspace/backend diagnosis
- Backup/recovery/change safety

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":829,"providerTotalMs":1617,"answerPreparationMs":1,"requestToFirstTokenMs":836,"requestToCompletedMs":1624,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-24-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: A Kafka consumer processes the same payment event twice. How would you prevent duplicate effects?

Transcript: not measured (text path or not run)

Answer: I’d make payment processing idempotent using a stable payment event ID, because Kafka delivery alone cannot guarantee a payment is applied only once. First, I’d check whether the duplicate came from a retry or offset replay. For database effects, I’d insert the event ID into a table with a unique constraint and apply the payment update in the same transaction, then commit the Kafka offset. A replay would hit the constraint and skip the update. For an external payment API, I’d pass the same idempotency key. The trade-off is deduplication storage and retention. I’d validate by replaying events and crashing between processing and offset commit, confirming exactly one payment effect.

Reference: Treat retries and redelivery as expected under at-least-once processing. Use a stable event or payment id and durable idempotency/deduplication around the side effect. Coordinate commit ordering and transactional/outbox patterns as appropriate; verify replay safety. Kafka transactions alone do not guarantee exactly-once effects in an external payment system.

- Redelivery/offset relationship
- Durable dedup/idempotency
- External side effects caveat/verification

Sources: https://kafka.apache.org/documentation/#semantics

Metrics: {"sttMs":null,"providerFirstTokenMs":1412,"providerTotalMs":4396,"answerPreparationMs":1,"requestToFirstTokenMs":1419,"requestToCompletedMs":4403,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-25-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Một microservice gọi downstream chậm và gây timeout dây chuyền. Bạn xử lý thế nào?

Transcript: not measured (text path or not run)

Answer: Trước tiên, tôi xác định mức ảnh hưởng và giữ lại trace, log, metric để phân biệt lỗi ở service hay downstream. Sau đó kiểm tra độ trễ, tỷ lệ timeout và mức bão hòa; nếu lỗi tăng sau thay đổi mới, rollback thay đổi đó. Giới hạn thời gian chờ và dùng circuit breaker để ngăn lan truyền, rồi xác nhận tỷ lệ lỗi và độ trễ đã phục hồi.

Reference: Xác định dependency gây chậm bằng traces, latency và saturation. Giới hạn timeout theo deadline tổng, retry có giới hạn/backoff cho thao tác an toàn, dùng circuit breaker hoặc bulkhead để chặn lan truyền. Giảm tải có kiểm soát rồi xác minh error rate và p95/p99, tránh retry storm.

- Evidence/trace
- Timeout and bounded retries
- Containment and verify

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":3748,"providerTotalMs":4895,"answerPreparationMs":2,"requestToFirstTokenMs":3757,"requestToCompletedMs":4902,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-26-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Are Kubernetes Secrets secure just because their values are base64 encoded?

Transcript: not measured (text path or not run)

Answer: No. Base64 is only an encoding, not encryption; Kubernetes Secrets need appropriate access controls and encryption at rest to protect their values.

Reference: No. Base64 is encoding, not encryption. Restrict Secret access with RBAC and workload identities, enable appropriate encryption at rest, and protect transport and logs. Rotate exposed secrets and consider an external secret manager; verify access boundaries.

- Encoding is not encryption
- Access restriction
- Encryption/rotation/secret manager

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":880,"providerTotalMs":1355,"answerPreparationMs":1,"requestToFirstTokenMs":895,"requestToCompletedMs":1362,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-27-2

Status: **completed**; quality: **needs_review**; screening: 33/100; reviewed score: n/a/100.

Question: Hãy kể một sự cố production bạn đã trực tiếp xử lý với vai trò DevOps.

Transcript: not measured (text path or not run)

Answer: Tôi chưa có thông tin xác thực về sự cố bạn từng trực tiếp xử lý, nên không nên bịa trải nghiệm. Bạn có thể điền vào mẫu: “Tôi trực tiếp xử lý sự cố [tác động], xác định nguyên nhân là [nguyên nhân], khôi phục bằng [biện pháp] và xác nhận dịch vụ hoạt động lại qua [tín hiệu kiểm tra].”

Reference: Khi chưa có hồ sơ xác thực, trả một khung Adaptable answer với Situation, Task, Action, Result và chỗ trống để ứng viên điền sự kiện thật. Không tự nhận đã xử lý một sự cố hay bịa công ty, số liệu và kết quả.

- Adaptable label
- STAR outline
- Placeholders/no invented incident

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":745,"providerTotalMs":1623,"answerPreparationMs":2,"requestToFirstTokenMs":755,"requestToCompletedMs":1633,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-28-2

Status: **error**; quality: **fail**; screening: 100/100; reviewed score: n/a/100.

Question: Tell me about your CI/CD experience based on the attached profile.

Transcript: not measured (text path or not run)

Answer: I built a GitLab CI pipeline for a personal Docker API practice project. The scope was a learning project, not a production service. My task was to set up CI/CD for the API, and my specific contributions were adding unit tests and a manual staging deployment step. That kept staging deployment as an explicit decision rather than an automatic action. The concrete result was a pipeline with unit testing and manual staging deployment. I don’t have measured business results or production incident ownership to claim; my experience is hands-on practice within that project’s scope.

Reference: Use only the supplied practice-project facts: built a GitLab CI pipeline for a personal Docker API, added tests and a manual staging deployment. Describe those actions and learning without claiming production ownership, employers or measured business improvements.

- GitLab practice project
- Tests/staging/manual deploy
- No invented production ownership

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":1423,"providerTotalMs":null,"answerPreparationMs":1,"requestToFirstTokenMs":1433,"requestToCompletedMs":4167,"speechEndToFirstVisibleMs":null}
Error: {"code":"LLM_GENERATION_FAILED"}

### text-devops-29-2

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: What if CPU requests are missing?

Transcript: not measured (text path or not run)

Answer: If CPU requests are missing, the HPA cannot calculate CPU utilization as a percentage of the requested CPU, so it cannot use that metric to scale the workload.

Reference: In the preceding CPU-utilization HPA context, utilization is defined relative to CPU requests. Without relevant requests it cannot calculate that metric as intended. Set appropriate requests, confirm metrics availability and inspect HPA conditions; other metric types have different prerequisites.

- CPU utilization relative to requests
- Cannot calculate/missing metric
- Verify HPA/metrics

Sources: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/

Metrics: {"sttMs":null,"providerFirstTokenMs":852,"providerTotalMs":1211,"answerPreparationMs":2,"requestToFirstTokenMs":863,"requestToCompletedMs":1221,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-30-2

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Nếu bản rollout đó có migration database không tương thích thì sao?

Transcript: not measured (text path or not run)

Answer: Nếu rollout có migration database không tương thích, việc rollback Deployment có thể khiến phiên bản ứng dụng cũ không hoạt động với schema mới. Vì vậy, cần bảo đảm migration có thể tương thích ngược hoặc có kế hoạch khôi phục database riêng trước khi rollback ứng dụng.

Reference: Rollback Deployment chỉ đổi phiên bản workload, không tự phục hồi schema hoặc dữ liệu. Dừng rollout, đánh giá tương thích và chọn forward fix hoặc khôi phục đã được kiểm thử theo RPO/RTO. Ưu tiên expand/contract cho lần sau và xác minh dữ liệu cùng ứng dụng.

- Rollback does not restore schema
- Recovery/forward fix/compatibility
- Verify/RPO/RTO

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":890,"providerTotalMs":1628,"answerPreparationMs":1,"requestToFirstTokenMs":899,"requestToCompletedMs":1635,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-01-3

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Docker là gì?

Transcript: not measured (text path or not run)

Answer: Docker là nền tảng dùng để đóng gói và chạy ứng dụng trong các container. Image là gói nhiều lớp chỉ đọc để tạo container; container là phiên bản đang chạy của image.

Reference: Docker đóng gói ứng dụng cùng phụ thuộc thành image và chạy thành container. Container là tiến trình được cô lập và chia sẻ kernel của host; image là khuôn đóng gói, khác với container đang chạy.

- Đóng gói ứng dụng và phụ thuộc
- Phân biệt image và container
- Cô lập tiến trình

Sources: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/

Metrics: {"sttMs":null,"providerFirstTokenMs":762,"providerTotalMs":1355,"answerPreparationMs":1,"requestToFirstTokenMs":773,"requestToCompletedMs":1361,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-02-3

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: What is the difference between a Docker image and a container?

Transcript: not measured (text path or not run)

Answer: A Docker image is a packaged, read-only layered artifact; a container is a running, isolated instance created from that image. Operationally, multiple containers can use the same image while keeping their runtime state separate, though writable container changes are usually lost when the container is removed. Choose an image when you need a reusable, versioned package; choose a container when you need to run that package, trading a disposable runtime for isolated execution.

Reference: An image is a packaged, read-only template. A container is an instance created from it, with a writable layer and process lifecycle. Containers can be stopped; an existing image is not modified by writing inside one.

- Image là template
- Container là instance
- Writable layer hoặc lifecycle

Sources: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/

Metrics: {"sttMs":null,"providerFirstTokenMs":758,"providerTotalMs":1602,"answerPreparationMs":1,"requestToFirstTokenMs":765,"requestToCompletedMs":1608,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-03-3

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Kubernetes HPA là gì?

Transcript: not measured (text path or not run)

Answer: Kubernetes HPA là bộ điều khiển tự động điều chỉnh số lượng Pod của một workload dựa trên các chỉ số như mức sử dụng CPU. HPA thay đổi số bản sao, không tự tăng hoặc giảm tài nguyên CPU và bộ nhớ được cấp cho từng Pod.

Reference: HPA điều chỉnh số replica của workload dựa trên metrics như CPU, memory hoặc custom metrics. Nó scale pod theo chiều ngang; không tự tăng số node. Với CPU utilization, cần resource requests và nguồn metrics phù hợp.

- Scale replica/pod
- Dựa trên metrics
- Phân biệt node scaling

Sources: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/

Metrics: {"sttMs":null,"providerFirstTokenMs":1429,"providerTotalMs":1957,"answerPreparationMs":1,"requestToFirstTokenMs":1439,"requestToCompletedMs":1963,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-04-3

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: How do readiness and liveness probes differ in Kubernetes?

Transcript: not measured (text path or not run)

Answer: A readiness probe determines whether a container should receive traffic; a liveness probe determines whether it should be restarted. A failed readiness check removes the pod from service endpoints, while a failed liveness check triggers a restart.

Reference: Readiness controls whether a pod receives service traffic. Liveness failures can restart a container. Startup probes protect slow initialization. A downstream dependency failure should not automatically trigger a restart loop; choose probe conditions and thresholds carefully.

- Readiness controls traffic
- Liveness restarts container
- Phân biệt failure action

Sources: https://kubernetes.io/docs/concepts/workloads/pods/probes/

Metrics: {"sttMs":null,"providerFirstTokenMs":2214,"providerTotalMs":2649,"answerPreparationMs":1,"requestToFirstTokenMs":2223,"requestToCompletedMs":2657,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-05-3

Status: **completed**; quality: **needs_review**; screening: 33/100; reviewed score: n/a/100.

Question: Terraform state dùng để làm gì?

Transcript: not measured (text path or not run)

Answer: Terraform state dùng để ghi lại tài nguyên hạ tầng thực tế mà Terraform quản lý và liên kết chúng với cấu hình trong mã nguồn. Terraform dựa vào state này để xác định cần tạo, cập nhật hay xóa tài nguyên.

Reference: State ánh xạ cấu hình Terraform tới tài nguyên thực và lưu metadata phục vụ plan. State có thể chứa dữ liệu nhạy cảm nên cần bảo vệ, backup, và dùng remote backend có locking phù hợp cho nhóm.

- Ánh xạ tài nguyên
- Plan hoặc metadata
- Bảo vệ state

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":1879,"providerTotalMs":2470,"answerPreparationMs":1,"requestToFirstTokenMs":1886,"requestToCompletedMs":2477,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-06-3

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Compare Terraform and AWS CloudFormation. When would you choose each?

Transcript: not measured (text path or not run)

Answer: Terraform uses a provider-based, cross-platform model, while CloudFormation is AWS’s native infrastructure-as-code service. Terraform’s broader ecosystem makes it useful across multiple cloud providers, but adds provider and state management; CloudFormation integrates directly with AWS resources and deployment workflows, but is less portable. I’d choose Terraform for mixed-provider environments, accepting the extra state-management responsibility. I’d choose CloudFormation for AWS-only infrastructure when native integration and simpler AWS operations matter more than portability.

Reference: Terraform uses providers and supports multiple platforms, while CloudFormation is AWS-native and manages stacks through AWS. Choose based on platform coverage, team skills, state/stack operations, and integration needs; neither automatically eliminates drift or deployment risk.

- Terraform providers/platforms
- CloudFormation AWS-native
- Choice and trade-off

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":858,"providerTotalMs":2270,"answerPreparationMs":1,"requestToFirstTokenMs":866,"requestToCompletedMs":2276,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-07-3

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Một commit lỗi đã được push lên nhánh chung. Nên dùng git revert hay reset?

Transcript: not measured (text path or not run)

Answer: Với commit lỗi đã được push lên nhánh chung, nên dùng `git revert` để tạo commit mới đảo ngược thay đổi mà không viết lại lịch sử. `git reset` thay đổi lịch sử nhánh nên có thể ảnh hưởng đến những người đã lấy nhánh đó.

Reference: Ưu tiên git revert để tạo commit đảo thay đổi mà không viết lại lịch sử dùng chung. Kiểm tra commit và chạy test trước khi merge/push. Reset phù hợp hơn với lịch sử local; force push nhánh chung cần quy trình phối hợp riêng.

- Ưu tiên revert
- Giữ lịch sử dùng chung
- Kiểm tra kết quả

Sources: https://git-scm.com/docs/git-revert

Metrics: {"sttMs":null,"providerFirstTokenMs":967,"providerTotalMs":1561,"answerPreparationMs":1,"requestToFirstTokenMs":976,"requestToCompletedMs":1568,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-08-3

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: A Linux server reports disk full, but du shows little usage. How do you investigate?

Transcript: not measured (text path or not run)

Answer: I’d first check user impact and compare `df -h` with `df -i` to distinguish block exhaustion from inode exhaustion. Then check whether `du` missed another filesystem or mount point, and inspect open deleted files with `lsof +L1`. If confirmed, identify the owning process before deciding whether a controlled restart is safe.

Reference: Compare filesystem space and inode usage with df -h and df -i. Check mount boundaries and deleted-but-open files using lsof +L1. Release space through a controlled log rotation or process action; verify capacity and service health rather than deleting files blindly.

- Filesystem/inodes
- Deleted open files
- Safe mitigation and verification

Sources: https://man7.org/linux/man-pages/man1/df.1.html

Metrics: {"sttMs":null,"providerFirstTokenMs":1856,"providerTotalMs":2605,"answerPreparationMs":3,"requestToFirstTokenMs":1867,"requestToCompletedMs":2614,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-09-3

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Pod Kubernetes không resolve được DNS của một Service. Bạn kiểm tra gì?

Transcript: not measured (text path or not run)

Answer: Tôi kiểm tra trước phạm vi ảnh hưởng, rồi xác nhận tên Service và namespace mà Pod đang truy vấn có chính xác không; sau đó kiểm tra cấu hình DNS của Pod và log của CoreDNS để khoanh vùng lỗi.

Reference: Kiểm tra tên Service, namespace và DNS từ một pod bằng nslookup hoặc dig. Xem resolv.conf, CoreDNS logs/endpoints và kết nối UDP/TCP 53 hoặc NetworkPolicy. Sửa đúng nguyên nhân rồi thử phân giải và gọi Service lại.

- Query DNS
- CoreDNS/service namespace
- Connectivity and verify

Sources: https://www.rfc-editor.org/rfc/rfc1034

Metrics: {"sttMs":null,"providerFirstTokenMs":918,"providerTotalMs":1524,"answerPreparationMs":2,"requestToFirstTokenMs":928,"requestToCompletedMs":1533,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-10-3

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: How would you troubleshoot a pod in CrashLoopBackOff?

Transcript: not measured (text path or not run)

Answer: I’d scope traffic impact and affected replicas, preserving evidence before restarting anything; CrashLoopBackOff is a symptom, not a diagnosis. I’d inspect `kubectl describe pod`, Events, termination reason and exit code, then `kubectl logs --previous` to distinguish OOM kills, startup/configuration errors, or dependency/DNS failures. I’d check probes—liveness can restart containers; readiness only removes endpoints—and correlate failures with the rollout revision. If service is degraded, I’d contain impact by routing to healthy replicas where possible. I’d apply the smallest reversible, evidence-supported fix, rolling back only with clear release correlation. Finally, I’d verify stable restart counts, readiness/endpoints, and service errors/latency, then add a regression check for the confirmed cause.

Reference: CrashLoopBackOff indicates repeated restarts with backoff, not a root cause. Inspect events, container termination state and previous logs. Check application configuration, dependencies, resources and probes; apply a targeted fix and verify restart count and service health.

- Events/termination state
- Previous logs
- Cause-specific remediation and verify

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":2051,"providerTotalMs":5082,"answerPreparationMs":1,"requestToFirstTokenMs":2057,"requestToCompletedMs":5088,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-11-3

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Một pod ở trạng thái Pending lâu. Bạn xử lý như thế nào?

Transcript: not measured (text path or not run)

Answer: Tôi sẽ kiểm tra `kubectl describe pod` để xác định pod đang chờ vì thiếu tài nguyên, lỗi scheduling hay vấn đề với PVC hoặc image; sau đó xử lý đúng nguyên nhân và xác nhận pod chuyển sang `Running` cùng dịch vụ hoạt động bình thường.

Reference: Xem kubectl describe pod và scheduler events trước. Kiểm tra requests so với capacity, taints/tolerations, affinity và PVC chưa bound. Điều chỉnh đúng ràng buộc hoặc bổ sung capacity rồi xác nhận pod Scheduled, Running và Ready.

- Scheduler events
- Resources and constraints
- Verify scheduling/readiness

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":906,"providerTotalMs":1833,"answerPreparationMs":2,"requestToFirstTokenMs":912,"requestToCompletedMs":1839,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-12-3

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Which kubectl commands would you use to check and roll back a Deployment rollout?

Transcript: not measured (text path or not run)

Answer: `kubectl rollout status deployment/<name> -n <namespace>` checks whether the Deployment has completed successfully; then use `kubectl rollout history deployment/<name> -n <namespace>` to inspect available revisions. If the current revision is unhealthy and a known-good revision exists, roll back explicitly with `kubectl rollout undo deployment/<name> -n <namespace> --to-revision=<revision>`. Then check rollout status again and confirm the application is serving correctly.

Reference: Use kubectl rollout status deployment/NAME and kubectl rollout history deployment/NAME to inspect progress and revisions. If rollback is appropriate, use kubectl rollout undo deployment/NAME with a known revision, then verify readiness and application health. Database changes may need a separate recovery plan.

- Rollout status
- Rollout history
- Rollback and verify

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":1922,"providerTotalMs":2963,"answerPreparationMs":1,"requestToFirstTokenMs":1930,"requestToCompletedMs":2968,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-13-3

Status: **completed**; quality: **needs_review**; screening: 33/100; reviewed score: n/a/100.

Question: Container Kubernetes bị OOMKilled. Có nên tăng memory limit ngay không?

Transcript: not measured (text path or not run)

Answer: Không nên tăng memory limit ngay; OOMKilled chỉ cho biết container bị kết thúc do vượt giới hạn bộ nhớ, chưa chứng minh giới hạn hiện tại là nguyên nhân gốc cần tăng. Trước tiên, hãy kiểm tra mức dùng bộ nhớ và thời điểm bị kill để phân biệt thiếu giới hạn với rò rỉ bộ nhớ hoặc tải tăng bất thường.

Reference: Xem termination reason, memory metrics và log để phân biệt tải tăng với memory leak hoặc cấu hình sai. So sánh requests/limits và capacity node. Tăng limit có kiểm soát khi có bằng chứng và capacity; kiểm chứng usage, restart và sức khỏe ứng dụng sau thay đổi.

- Thu thập bằng chứng memory
- Limit/capacity or leak
- Verify after change

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":1298,"providerTotalMs":2306,"answerPreparationMs":1,"requestToFirstTokenMs":1306,"requestToCompletedMs":2314,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-14-3

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Design a safe CI/CD deployment flow for a production API.

Transcript: not measured (text path or not run)

Answer: I’d use a gated, progressive deployment flow that limits production exposure and keeps application rollback straightforward. CI runs tests and security checks, builds the API image once, and promotes that immutable digest. Deployment uses a narrowly scoped identity; secrets stay outside the image. In Kubernetes, readiness probes gate traffic, replicas span failure domains, and a canary receives limited traffic before promotion. Database changes remain backward-compatible so the previous application version can still run. I’d compare canary error rate and latency against the stable version, automatically reverting traffic on sustained regression. Progressive delivery costs extra capacity, but limits blast radius; a final API smoke test verifies user-visible recovery.

Reference: Build and test one immutable artifact, scan it, and promote the same version through environments. Use staged rollout with readiness and application checks. Monitor errors and latency; stop or roll back to a known good artifact when thresholds fail, accounting for database compatibility.

- Same immutable artifact
- Staged delivery and tests
- Verification and rollback

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":1061,"providerTotalMs":5200,"answerPreparationMs":2,"requestToFirstTokenMs":1069,"requestToCompletedMs":5208,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-15-3

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: GitLab CI khác Jenkins như thế nào, khi nào chọn mỗi công cụ?

Transcript: not measured (text path or not run)

Answer: GitLab CI là hệ thống CI/CD tích hợp trong GitLab, còn Jenkins là máy chủ tự động hóa độc lập, thường cần cài đặt và quản lý riêng. Chọn GitLab CI khi ưu tiên tích hợp liền mạch với GitLab; chọn Jenkins khi cần linh hoạt hơn về plugin và cấu hình hệ thống.

Reference: GitLab CI tích hợp pipeline với repository và dùng runners; Jenkins là automation server linh hoạt với plugin/agents và cần vận hành nhiều hơn. Chọn theo hệ sinh thái hiện có, nhu cầu tùy biến, bảo mật plugin và chi phí bảo trì, không chỉ số lượng tính năng.

- GitLab integration/runners
- Jenkins flexibility/plugins
- Operational choice

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":933,"providerTotalMs":1596,"answerPreparationMs":2,"requestToFirstTokenMs":940,"requestToCompletedMs":1602,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-16-3

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: An AWS access key was committed to a public Git repository. What should you do?

Transcript: not measured (text path or not run)

Answer: Immediately deactivate the exposed access key in IAM; deleting it from the repository alone does not stop its use. Create a replacement only for legitimate workloads, then review CloudTrail for unauthorized activity and remove the secret from repository history, treating it as compromised even after removal.

Reference: Revoke or disable the exposed credential promptly and replace legitimate workloads with new credentials or roles. Investigate CloudTrail and access scope for abuse, preserve evidence and assess impact. Remove the secret from history and add scanning, but history cleanup alone does not revoke leaked copies.

- Revoke/rotate credential
- Investigate abuse
- History cleanup is insufficient

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":2079,"providerTotalMs":3018,"answerPreparationMs":1,"requestToFirstTokenMs":2086,"requestToCompletedMs":3025,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-17-3

Status: **completed**; quality: **needs_review**; screening: 33/100; reviewed score: n/a/100.

Question: Áp dụng least privilege cho ứng dụng chạy trên AWS như thế nào?

Transcript: not measured (text path or not run)

Answer: Tôi áp dụng least privilege bằng cách chỉ cấp cho ứng dụng những quyền AWS tối thiểu cần thiết để hoạt động, giới hạn theo hành động và tài nguyên cụ thể. Quyền này được gắn với danh tính của workload, thay vì dùng thông tin xác thực có quyền rộng.

Reference: Dùng IAM role và credential tạm thời cho workload. Chỉ cấp action/resource cần thiết, bổ sung conditions phù hợp; kiểm tra Access Analyzer/CloudTrail để thu hẹp quyền. Xác minh ứng dụng vẫn hoạt động và thao tác ngoài phạm vi bị từ chối, không dùng AdministratorAccess để chữa lỗi.

- Role/temporary credentials
- Actions/resources narrowly scoped
- Verify/access review

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":941,"providerTotalMs":1666,"answerPreparationMs":2,"requestToFirstTokenMs":947,"requestToCompletedMs":1672,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-18-3

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: As a senior DevOps engineer, design a highly available API on AWS and explain a trade-off.

Transcript: not measured (text path or not run)

Answer: I’d use a multi-AZ architecture that keeps API instances stateless and contains Availability Zone failures. An Application Load Balancer routes traffic to an Auto Scaling group across two AZs, with instances in private subnets. RDS Multi-AZ handles database failover, although connections can briefly fail during promotion. Security groups restrict traffic between tiers, and IAM roles provide least-privilege access. I’d deploy immutable application versions gradually, rolling back on elevated error rates or latency. Multi-AZ adds infrastructure cost but reduces exposure to an AZ outage. I’d validate failover under load and monitor API success rate, p95 latency, and healthy capacity.

Reference: Start from availability, RTO/RPO and load requirements. Spread stateless compute behind a load balancer across Availability Zones with health checks and autoscaling; choose a suitable database HA mode. State failover and cost/consistency trade-offs, use reversible deployments, and test failover against SLOs rather than promising zero downtime.

- Requirements/SLO/RTO
- Multiple AZ/failure domains
- Trade-off and failure verification

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":1534,"providerTotalMs":5128,"answerPreparationMs":1,"requestToFirstTokenMs":1541,"requestToCompletedMs":5135,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-19-3

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: SLI, SLO và SLA khác nhau như thế nào?

Transcript: not measured (text path or not run)

Answer: Điểm khác biệt chính là SLI đo lường, SLO đặt mục tiêu nội bộ, còn SLA là cam kết với khách hàng. SLI có thể là tỷ lệ yêu cầu thành công; SLO quy định mức cần đạt trong một khoảng thời gian; SLA thường gắn với hậu quả hoặc bồi hoàn nếu vi phạm. Vì vậy, SLO giúp đội vận hành quản lý độ tin cậy và ngân sách lỗi, còn SLA tạo rủi ro tài chính và uy tín. Chọn SLI để theo dõi, SLO để điều hành dịch vụ; chỉ cam kết SLA khi có thể kiểm soát và đo lường mức dịch vụ, vì cam kết chặt hơn tăng trách nhiệm nhưng tạo niềm tin khách hàng.

Reference: SLI là chỉ số đo trải nghiệm dịch vụ, ví dụ tỷ lệ request thành công. SLO là mục tiêu cho chỉ số đó trong một cửa sổ thời gian. SLA là cam kết với khách hàng, thường có hậu quả hợp đồng khi vi phạm; ba khái niệm không đồng nghĩa.

- SLI measurement
- SLO objective/window
- SLA agreement/consequence

Sources: https://sre.google/sre-book/service-level-objectives/

Metrics: {"sttMs":null,"providerFirstTokenMs":1011,"providerTotalMs":2454,"answerPreparationMs":1,"requestToFirstTokenMs":1031,"requestToCompletedMs":2460,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-20-3

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: How would you reduce noisy Prometheus alerts without hiding real incidents?

Transcript: not measured (text path or not run)

Answer: I would tune alerts around sustained user impact, rather than simply raising thresholds or disabling rules. First, I’d review recent firings against actual incidents to identify flapping, duplicate, and non-actionable alerts. Then I’d adjust one noisy rule at a time, adding a `for` duration where brief spikes are harmless, and use Alertmanager grouping and inhibition to reduce duplicate notifications during a confirmed upstream failure. I’d keep urgent alerts for fast-moving failures. The trade-off is slower detection, so I’d compare notification volume and detection delay against historical incidents, then monitor for missed incidents before expanding the changes.

Reference: Prefer actionable user-impact or SLO-based alerts, with meaningful duration and thresholds. Use Alertmanager grouping, deduplication and inhibition for related symptoms. Validate rules against incidents and test recovery; avoid silencing everything or using CPU alone as a universal paging signal.

- User impact/SLO
- Duration/grouping/deduplication
- Verify alert behavior

Sources: https://prometheus.io/docs/practices/alerting/

Metrics: {"sttMs":null,"providerFirstTokenMs":1392,"providerTotalMs":4960,"answerPreparationMs":1,"requestToFirstTokenMs":1401,"requestToCompletedMs":4967,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-21-3

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Idempotency trong Ansible nghĩa là gì?

Transcript: not measured (text path or not run)

Answer: Idempotency trong Ansible nghĩa là chạy cùng một playbook nhiều lần vẫn đưa hệ thống về trạng thái mong muốn mà không tạo thay đổi không cần thiết khi trạng thái đó đã đạt được. Nhờ vậy, có thể chạy lại playbook an toàn hơn sau lỗi hoặc khi cần đồng bộ cấu hình.

Reference: Chạy lại cùng cấu hình nhiều lần vẫn hội tụ về trạng thái mong muốn mà không tạo thêm thay đổi không cần thiết. Ưu tiên module khai báo trạng thái; command hoặc shell không tự bảo đảm idempotency nếu không có điều kiện bảo vệ.

- Repeated convergence
- Desired state/no extra changes
- Module vs shell caveat

Sources: https://docs.ansible.com/ansible/latest/reference_appendices/glossary.html

Metrics: {"sttMs":null,"providerFirstTokenMs":3810,"providerTotalMs":4727,"answerPreparationMs":1,"requestToFirstTokenMs":3817,"requestToCompletedMs":4733,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-22-3

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: A service fails TLS certificate validation. How do you investigate safely?

Transcript: not measured (text path or not run)

Answer: I’d first identify which clients and endpoints are affected and preserve the exact validation error and certificate chain. Then I’d check the hostname, certificate dates, trust chain, and client trust store, comparing results across affected and unaffected clients. I’d avoid disabling verification; after a targeted fix, I’d verify both TLS validation and the user-facing request.

Reference: Inspect certificate validity dates, hostname/SAN and the full certificate chain using an appropriate TLS client. Check trust store, SNI and client clock. Repair the certificate or trust configuration and verify validation succeeds; disabling verification is not a production fix.

- Expiry/hostname/chain
- Trust store/SNI/clock
- Verify securely

Sources: https://www.rfc-editor.org/rfc/rfc8446

Metrics: {"sttMs":null,"providerFirstTokenMs":2148,"providerTotalMs":3130,"answerPreparationMs":1,"requestToFirstTokenMs":2155,"requestToCompletedMs":3136,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-23-3

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Terraform plan bất ngờ muốn destroy database production. Bạn làm gì?

Transcript: not measured (text path or not run)

Answer: Tôi sẽ dừng apply ngay, vì `terraform plan` chỉ đề xuất thay đổi chứ chưa thực thi; kiểm tra state và cấu hình để xác định vì sao database bị đánh dấu destroy, rồi chỉ tiếp tục khi đã xác nhận nguyên nhân và có phương án bảo vệ dữ liệu.

Reference: Dừng apply và giữ lại plan/state để điều tra. Kiểm tra workspace, backend, cấu hình, resource address, drift và thay đổi provider. Xác nhận backup/restore và dùng biện pháp migration/import phù hợp, review lại plan trước khi cho phép thay đổi; không force apply hay xóa state tùy tiện.

- Stop/review apply
- State/workspace/backend diagnosis
- Backup/recovery/change safety

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":1434,"providerTotalMs":2094,"answerPreparationMs":1,"requestToFirstTokenMs":1440,"requestToCompletedMs":2100,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-24-3

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: A Kafka consumer processes the same payment event twice. How would you prevent duplicate effects?

Transcript: not measured (text path or not run)

Answer: I’d make payment processing idempotent using a stable payment event ID, because Kafka can redeliver records. First, I’d inspect the event ID and offset history to distinguish redelivery from two separately published events. Then I’d store the event ID under a unique database constraint in the same transaction as the payment update, and commit the Kafka offset only after that transaction succeeds. A replay then becomes a no-op. For an external payment API, I’d pass a stable idempotency key; a local transaction alone cannot protect that call. The trade-off is deduplication storage and retention. I’d validate by replaying events and crashing before offset commit, confirming exactly one payment effect.

Reference: Treat retries and redelivery as expected under at-least-once processing. Use a stable event or payment id and durable idempotency/deduplication around the side effect. Coordinate commit ordering and transactional/outbox patterns as appropriate; verify replay safety. Kafka transactions alone do not guarantee exactly-once effects in an external payment system.

- Redelivery/offset relationship
- Durable dedup/idempotency
- External side effects caveat/verification

Sources: https://kafka.apache.org/documentation/#semantics

Metrics: {"sttMs":null,"providerFirstTokenMs":1197,"providerTotalMs":4545,"answerPreparationMs":1,"requestToFirstTokenMs":1204,"requestToCompletedMs":4551,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-25-3

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Một microservice gọi downstream chậm và gây timeout dây chuyền. Bạn xử lý thế nào?

Transcript: not measured (text path or not run)

Answer: Trước hết, tôi xác định phạm vi ảnh hưởng và giữ lại trace, log, metric. Tôi kiểm tra tỷ lệ timeout, độ trễ và trace để xác nhận downstream nào gây nghẽn; sau đó giới hạn request hoặc bật circuit breaker để khoanh vùng. Khi downstream phục hồi, tôi xác nhận tỷ lệ lỗi giảm và request người dùng thành công.

Reference: Xác định dependency gây chậm bằng traces, latency và saturation. Giới hạn timeout theo deadline tổng, retry có giới hạn/backoff cho thao tác an toàn, dùng circuit breaker hoặc bulkhead để chặn lan truyền. Giảm tải có kiểm soát rồi xác minh error rate và p95/p99, tránh retry storm.

- Evidence/trace
- Timeout and bounded retries
- Containment and verify

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":3743,"providerTotalMs":4520,"answerPreparationMs":2,"requestToFirstTokenMs":3754,"requestToCompletedMs":4528,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-26-3

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: Are Kubernetes Secrets secure just because their values are base64 encoded?

Transcript: not measured (text path or not run)

Answer: No, Kubernetes Secrets are not secure merely because their values are base64 encoded; base64 is encoding, not encryption. Secrets require appropriate access controls, and encryption at rest must be configured separately.

Reference: No. Base64 is encoding, not encryption. Restrict Secret access with RBAC and workload identities, enable appropriate encryption at rest, and protect transport and logs. Rotate exposed secrets and consider an external secret manager; verify access boundaries.

- Encoding is not encryption
- Access restriction
- Encryption/rotation/secret manager

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":3451,"providerTotalMs":3938,"answerPreparationMs":1,"requestToFirstTokenMs":3458,"requestToCompletedMs":3945,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-27-3

Status: **completed**; quality: **needs_review**; screening: 33/100; reviewed score: n/a/100.

Question: Hãy kể một sự cố production bạn đã trực tiếp xử lý với vai trò DevOps.

Transcript: not measured (text path or not run)

Answer: Tôi chưa có thông tin về sự cố thực tế bạn từng xử lý, nên bạn có thể trả lời theo mẫu: “Tôi trực tiếp xử lý sự cố [mô tả ngắn], ảnh hưởng đến [dịch vụ hoặc người dùng]. Tôi đã [hành động chính], xác nhận khôi phục bằng [tín hiệu], rồi phối hợp tìm nguyên nhân và ngăn tái diễn bằng [biện pháp].”

Reference: Khi chưa có hồ sơ xác thực, trả một khung Adaptable answer với Situation, Task, Action, Result và chỗ trống để ứng viên điền sự kiện thật. Không tự nhận đã xử lý một sự cố hay bịa công ty, số liệu và kết quả.

- Adaptable label
- STAR outline
- Placeholders/no invented incident

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":1149,"providerTotalMs":2166,"answerPreparationMs":2,"requestToFirstTokenMs":1156,"requestToCompletedMs":2172,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-28-3

Status: **error**; quality: **fail**; screening: 100/100; reviewed score: n/a/100.

Question: Tell me about your CI/CD experience based on the attached profile.

Transcript: not measured (text path or not run)

Answer: I built a GitLab CI pipeline for a personal Docker API practice project. The scope was a working CI/CD setup for that project, rather than a production deployment. I added unit tests to the pipeline and a manual staging deployment, keeping deployment as an explicit decision rather than making it fully automatic. The concrete result was a pipeline with automated testing and a manually triggered staging step. I don’t have measured business results or production incident ownership to claim, so I’d describe this as hands-on foundational CI/CD experience, not production-scale delivery experience.

Reference: Use only the supplied practice-project facts: built a GitLab CI pipeline for a personal Docker API, added tests and a manual staging deployment. Describe those actions and learning without claiming production ownership, employers or measured business improvements.

- GitLab practice project
- Tests/staging/manual deploy
- No invented production ownership

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":1410,"providerTotalMs":null,"answerPreparationMs":1,"requestToFirstTokenMs":1416,"requestToCompletedMs":4453,"speechEndToFirstVisibleMs":null}
Error: {"code":"LLM_GENERATION_FAILED"}

### text-devops-29-3

Status: **completed**; quality: **needs_review**; screening: 100/100; reviewed score: n/a/100.

Question: What if CPU requests are missing?

Transcript: not measured (text path or not run)

Answer: If CPU requests are missing, HPA cannot calculate CPU utilization for the affected Pods, so it cannot make scaling decisions from that metric. Set CPU requests for every container in each Pod for CPU-based utilization scaling to work.

Reference: In the preceding CPU-utilization HPA context, utilization is defined relative to CPU requests. Without relevant requests it cannot calculate that metric as intended. Set appropriate requests, confirm metrics availability and inspect HPA conditions; other metric types have different prerequisites.

- CPU utilization relative to requests
- Cannot calculate/missing metric
- Verify HPA/metrics

Sources: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/

Metrics: {"sttMs":null,"providerFirstTokenMs":3710,"providerTotalMs":4348,"answerPreparationMs":2,"requestToFirstTokenMs":3719,"requestToCompletedMs":4356,"speechEndToFirstVisibleMs":null}
Error: none

### text-devops-30-3

Status: **completed**; quality: **needs_review**; screening: 67/100; reviewed score: n/a/100.

Question: Nếu bản rollout đó có migration database không tương thích thì sao?

Transcript: not measured (text path or not run)

Answer: Nếu rollout có migration database không tương thích, rollback ứng dụng có thể không khôi phục dịch vụ vì schema mới vẫn còn. Migration tương thích ngược cho phép các phiên bản ứng dụng cũ và mới cùng hoạt động trong thời gian chuyển đổi.

Reference: Rollback Deployment chỉ đổi phiên bản workload, không tự phục hồi schema hoặc dữ liệu. Dừng rollout, đánh giá tương thích và chọn forward fix hoặc khôi phục đã được kiểm thử theo RPO/RTO. Ưu tiên expand/contract cho lần sau và xác minh dữ liệu cùng ứng dụng.

- Rollback does not restore schema
- Recovery/forward fix/compatibility
- Verify/RPO/RTO

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":1359,"providerTotalMs":2005,"answerPreparationMs":2,"requestToFirstTokenMs":1370,"requestToCompletedMs":2015,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-01-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Docker là gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Docker đóng gói ứng dụng cùng phụ thuộc thành image và chạy thành container. Container là tiến trình được cô lập và chia sẻ kernel của host; image là khuôn đóng gói, khác với container đang chạy.

- Đóng gói ứng dụng và phụ thuộc
- Phân biệt image và container
- Cô lập tiến trình

Sources: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-02-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: What is the difference between a Docker image and a container?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: An image is a packaged, read-only template. A container is an instance created from it, with a writable layer and process lifecycle. Containers can be stopped; an existing image is not modified by writing inside one.

- Image là template
- Container là instance
- Writable layer hoặc lifecycle

Sources: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-03-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Kubernetes HPA là gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: HPA điều chỉnh số replica của workload dựa trên metrics như CPU, memory hoặc custom metrics. Nó scale pod theo chiều ngang; không tự tăng số node. Với CPU utilization, cần resource requests và nguồn metrics phù hợp.

- Scale replica/pod
- Dựa trên metrics
- Phân biệt node scaling

Sources: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-04-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: How do readiness and liveness probes differ in Kubernetes?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Readiness controls whether a pod receives service traffic. Liveness failures can restart a container. Startup probes protect slow initialization. A downstream dependency failure should not automatically trigger a restart loop; choose probe conditions and thresholds carefully.

- Readiness controls traffic
- Liveness restarts container
- Phân biệt failure action

Sources: https://kubernetes.io/docs/concepts/workloads/pods/probes/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-05-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Terraform state dùng để làm gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: State ánh xạ cấu hình Terraform tới tài nguyên thực và lưu metadata phục vụ plan. State có thể chứa dữ liệu nhạy cảm nên cần bảo vệ, backup, và dùng remote backend có locking phù hợp cho nhóm.

- Ánh xạ tài nguyên
- Plan hoặc metadata
- Bảo vệ state

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-06-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Compare Terraform and AWS CloudFormation. When would you choose each?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Terraform uses providers and supports multiple platforms, while CloudFormation is AWS-native and manages stacks through AWS. Choose based on platform coverage, team skills, state/stack operations, and integration needs; neither automatically eliminates drift or deployment risk.

- Terraform providers/platforms
- CloudFormation AWS-native
- Choice and trade-off

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-07-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Một commit lỗi đã được push lên nhánh chung. Nên dùng git revert hay reset?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Ưu tiên git revert để tạo commit đảo thay đổi mà không viết lại lịch sử dùng chung. Kiểm tra commit và chạy test trước khi merge/push. Reset phù hợp hơn với lịch sử local; force push nhánh chung cần quy trình phối hợp riêng.

- Ưu tiên revert
- Giữ lịch sử dùng chung
- Kiểm tra kết quả

Sources: https://git-scm.com/docs/git-revert

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-08-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: A Linux server reports disk full, but du shows little usage. How do you investigate?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Compare filesystem space and inode usage with df -h and df -i. Check mount boundaries and deleted-but-open files using lsof +L1. Release space through a controlled log rotation or process action; verify capacity and service health rather than deleting files blindly.

- Filesystem/inodes
- Deleted open files
- Safe mitigation and verification

Sources: https://man7.org/linux/man-pages/man1/df.1.html

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-09-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Pod Kubernetes không resolve được DNS của một Service. Bạn kiểm tra gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Kiểm tra tên Service, namespace và DNS từ một pod bằng nslookup hoặc dig. Xem resolv.conf, CoreDNS logs/endpoints và kết nối UDP/TCP 53 hoặc NetworkPolicy. Sửa đúng nguyên nhân rồi thử phân giải và gọi Service lại.

- Query DNS
- CoreDNS/service namespace
- Connectivity and verify

Sources: https://www.rfc-editor.org/rfc/rfc1034

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-10-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: How would you troubleshoot a pod in CrashLoopBackOff?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: CrashLoopBackOff indicates repeated restarts with backoff, not a root cause. Inspect events, container termination state and previous logs. Check application configuration, dependencies, resources and probes; apply a targeted fix and verify restart count and service health.

- Events/termination state
- Previous logs
- Cause-specific remediation and verify

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-11-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Một pod ở trạng thái Pending lâu. Bạn xử lý như thế nào?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Xem kubectl describe pod và scheduler events trước. Kiểm tra requests so với capacity, taints/tolerations, affinity và PVC chưa bound. Điều chỉnh đúng ràng buộc hoặc bổ sung capacity rồi xác nhận pod Scheduled, Running và Ready.

- Scheduler events
- Resources and constraints
- Verify scheduling/readiness

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-12-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Which kubectl commands would you use to check and roll back a Deployment rollout?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Use kubectl rollout status deployment/NAME and kubectl rollout history deployment/NAME to inspect progress and revisions. If rollback is appropriate, use kubectl rollout undo deployment/NAME with a known revision, then verify readiness and application health. Database changes may need a separate recovery plan.

- Rollout status
- Rollout history
- Rollback and verify

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-13-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Container Kubernetes bị OOMKilled. Có nên tăng memory limit ngay không?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Xem termination reason, memory metrics và log để phân biệt tải tăng với memory leak hoặc cấu hình sai. So sánh requests/limits và capacity node. Tăng limit có kiểm soát khi có bằng chứng và capacity; kiểm chứng usage, restart và sức khỏe ứng dụng sau thay đổi.

- Thu thập bằng chứng memory
- Limit/capacity or leak
- Verify after change

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-14-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Design a safe CI/CD deployment flow for a production API.

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Build and test one immutable artifact, scan it, and promote the same version through environments. Use staged rollout with readiness and application checks. Monitor errors and latency; stop or roll back to a known good artifact when thresholds fail, accounting for database compatibility.

- Same immutable artifact
- Staged delivery and tests
- Verification and rollback

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-15-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: GitLab CI khác Jenkins như thế nào, khi nào chọn mỗi công cụ?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: GitLab CI tích hợp pipeline với repository và dùng runners; Jenkins là automation server linh hoạt với plugin/agents và cần vận hành nhiều hơn. Chọn theo hệ sinh thái hiện có, nhu cầu tùy biến, bảo mật plugin và chi phí bảo trì, không chỉ số lượng tính năng.

- GitLab integration/runners
- Jenkins flexibility/plugins
- Operational choice

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-16-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: An AWS access key was committed to a public Git repository. What should you do?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Revoke or disable the exposed credential promptly and replace legitimate workloads with new credentials or roles. Investigate CloudTrail and access scope for abuse, preserve evidence and assess impact. Remove the secret from history and add scanning, but history cleanup alone does not revoke leaked copies.

- Revoke/rotate credential
- Investigate abuse
- History cleanup is insufficient

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-17-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Áp dụng least privilege cho ứng dụng chạy trên AWS như thế nào?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Dùng IAM role và credential tạm thời cho workload. Chỉ cấp action/resource cần thiết, bổ sung conditions phù hợp; kiểm tra Access Analyzer/CloudTrail để thu hẹp quyền. Xác minh ứng dụng vẫn hoạt động và thao tác ngoài phạm vi bị từ chối, không dùng AdministratorAccess để chữa lỗi.

- Role/temporary credentials
- Actions/resources narrowly scoped
- Verify/access review

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-18-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: As a senior DevOps engineer, design a highly available API on AWS and explain a trade-off.

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Start from availability, RTO/RPO and load requirements. Spread stateless compute behind a load balancer across Availability Zones with health checks and autoscaling; choose a suitable database HA mode. State failover and cost/consistency trade-offs, use reversible deployments, and test failover against SLOs rather than promising zero downtime.

- Requirements/SLO/RTO
- Multiple AZ/failure domains
- Trade-off and failure verification

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-19-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: SLI, SLO và SLA khác nhau như thế nào?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: SLI là chỉ số đo trải nghiệm dịch vụ, ví dụ tỷ lệ request thành công. SLO là mục tiêu cho chỉ số đó trong một cửa sổ thời gian. SLA là cam kết với khách hàng, thường có hậu quả hợp đồng khi vi phạm; ba khái niệm không đồng nghĩa.

- SLI measurement
- SLO objective/window
- SLA agreement/consequence

Sources: https://sre.google/sre-book/service-level-objectives/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-20-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: How would you reduce noisy Prometheus alerts without hiding real incidents?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Prefer actionable user-impact or SLO-based alerts, with meaningful duration and thresholds. Use Alertmanager grouping, deduplication and inhibition for related symptoms. Validate rules against incidents and test recovery; avoid silencing everything or using CPU alone as a universal paging signal.

- User impact/SLO
- Duration/grouping/deduplication
- Verify alert behavior

Sources: https://prometheus.io/docs/practices/alerting/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-21-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Idempotency trong Ansible nghĩa là gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Chạy lại cùng cấu hình nhiều lần vẫn hội tụ về trạng thái mong muốn mà không tạo thêm thay đổi không cần thiết. Ưu tiên module khai báo trạng thái; command hoặc shell không tự bảo đảm idempotency nếu không có điều kiện bảo vệ.

- Repeated convergence
- Desired state/no extra changes
- Module vs shell caveat

Sources: https://docs.ansible.com/ansible/latest/reference_appendices/glossary.html

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-22-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: A service fails TLS certificate validation. How do you investigate safely?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Inspect certificate validity dates, hostname/SAN and the full certificate chain using an appropriate TLS client. Check trust store, SNI and client clock. Repair the certificate or trust configuration and verify validation succeeds; disabling verification is not a production fix.

- Expiry/hostname/chain
- Trust store/SNI/clock
- Verify securely

Sources: https://www.rfc-editor.org/rfc/rfc8446

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-23-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Terraform plan bất ngờ muốn destroy database production. Bạn làm gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Dừng apply và giữ lại plan/state để điều tra. Kiểm tra workspace, backend, cấu hình, resource address, drift và thay đổi provider. Xác nhận backup/restore và dùng biện pháp migration/import phù hợp, review lại plan trước khi cho phép thay đổi; không force apply hay xóa state tùy tiện.

- Stop/review apply
- State/workspace/backend diagnosis
- Backup/recovery/change safety

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-24-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: A Kafka consumer processes the same payment event twice. How would you prevent duplicate effects?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Treat retries and redelivery as expected under at-least-once processing. Use a stable event or payment id and durable idempotency/deduplication around the side effect. Coordinate commit ordering and transactional/outbox patterns as appropriate; verify replay safety. Kafka transactions alone do not guarantee exactly-once effects in an external payment system.

- Redelivery/offset relationship
- Durable dedup/idempotency
- External side effects caveat/verification

Sources: https://kafka.apache.org/documentation/#semantics

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-25-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Một microservice gọi downstream chậm và gây timeout dây chuyền. Bạn xử lý thế nào?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Xác định dependency gây chậm bằng traces, latency và saturation. Giới hạn timeout theo deadline tổng, retry có giới hạn/backoff cho thao tác an toàn, dùng circuit breaker hoặc bulkhead để chặn lan truyền. Giảm tải có kiểm soát rồi xác minh error rate và p95/p99, tránh retry storm.

- Evidence/trace
- Timeout and bounded retries
- Containment and verify

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-26-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Are Kubernetes Secrets secure just because their values are base64 encoded?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: No. Base64 is encoding, not encryption. Restrict Secret access with RBAC and workload identities, enable appropriate encryption at rest, and protect transport and logs. Rotate exposed secrets and consider an external secret manager; verify access boundaries.

- Encoding is not encryption
- Access restriction
- Encryption/rotation/secret manager

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-27-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Hãy kể một sự cố production bạn đã trực tiếp xử lý với vai trò DevOps.

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Khi chưa có hồ sơ xác thực, trả một khung Adaptable answer với Situation, Task, Action, Result và chỗ trống để ứng viên điền sự kiện thật. Không tự nhận đã xử lý một sự cố hay bịa công ty, số liệu và kết quả.

- Adaptable label
- STAR outline
- Placeholders/no invented incident

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-28-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Tell me about your CI/CD experience based on the attached profile.

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Use only the supplied practice-project facts: built a GitLab CI pipeline for a personal Docker API, added tests and a manual staging deployment. Describe those actions and learning without claiming production ownership, employers or measured business improvements.

- GitLab practice project
- Tests/staging/manual deploy
- No invented production ownership

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-29-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: What if CPU requests are missing?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: In the preceding CPU-utilization HPA context, utilization is defined relative to CPU requests. Without relevant requests it cannot calculate that metric as intended. Set appropriate requests, confirm metrics availability and inspect HPA conditions; other metric types have different prerequisites.

- CPU utilization relative to requests
- Cannot calculate/missing metric
- Verify HPA/metrics

Sources: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-30-1

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Nếu bản rollout đó có migration database không tương thích thì sao?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Rollback Deployment chỉ đổi phiên bản workload, không tự phục hồi schema hoặc dữ liệu. Dừng rollout, đánh giá tương thích và chọn forward fix hoặc khôi phục đã được kiểm thử theo RPO/RTO. Ưu tiên expand/contract cho lần sau và xác minh dữ liệu cùng ứng dụng.

- Rollback does not restore schema
- Recovery/forward fix/compatibility
- Verify/RPO/RTO

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-01-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Docker là gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Docker đóng gói ứng dụng cùng phụ thuộc thành image và chạy thành container. Container là tiến trình được cô lập và chia sẻ kernel của host; image là khuôn đóng gói, khác với container đang chạy.

- Đóng gói ứng dụng và phụ thuộc
- Phân biệt image và container
- Cô lập tiến trình

Sources: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-02-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: What is the difference between a Docker image and a container?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: An image is a packaged, read-only template. A container is an instance created from it, with a writable layer and process lifecycle. Containers can be stopped; an existing image is not modified by writing inside one.

- Image là template
- Container là instance
- Writable layer hoặc lifecycle

Sources: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-03-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Kubernetes HPA là gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: HPA điều chỉnh số replica của workload dựa trên metrics như CPU, memory hoặc custom metrics. Nó scale pod theo chiều ngang; không tự tăng số node. Với CPU utilization, cần resource requests và nguồn metrics phù hợp.

- Scale replica/pod
- Dựa trên metrics
- Phân biệt node scaling

Sources: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-04-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: How do readiness and liveness probes differ in Kubernetes?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Readiness controls whether a pod receives service traffic. Liveness failures can restart a container. Startup probes protect slow initialization. A downstream dependency failure should not automatically trigger a restart loop; choose probe conditions and thresholds carefully.

- Readiness controls traffic
- Liveness restarts container
- Phân biệt failure action

Sources: https://kubernetes.io/docs/concepts/workloads/pods/probes/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-05-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Terraform state dùng để làm gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: State ánh xạ cấu hình Terraform tới tài nguyên thực và lưu metadata phục vụ plan. State có thể chứa dữ liệu nhạy cảm nên cần bảo vệ, backup, và dùng remote backend có locking phù hợp cho nhóm.

- Ánh xạ tài nguyên
- Plan hoặc metadata
- Bảo vệ state

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-06-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Compare Terraform and AWS CloudFormation. When would you choose each?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Terraform uses providers and supports multiple platforms, while CloudFormation is AWS-native and manages stacks through AWS. Choose based on platform coverage, team skills, state/stack operations, and integration needs; neither automatically eliminates drift or deployment risk.

- Terraform providers/platforms
- CloudFormation AWS-native
- Choice and trade-off

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-07-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Một commit lỗi đã được push lên nhánh chung. Nên dùng git revert hay reset?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Ưu tiên git revert để tạo commit đảo thay đổi mà không viết lại lịch sử dùng chung. Kiểm tra commit và chạy test trước khi merge/push. Reset phù hợp hơn với lịch sử local; force push nhánh chung cần quy trình phối hợp riêng.

- Ưu tiên revert
- Giữ lịch sử dùng chung
- Kiểm tra kết quả

Sources: https://git-scm.com/docs/git-revert

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-08-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: A Linux server reports disk full, but du shows little usage. How do you investigate?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Compare filesystem space and inode usage with df -h and df -i. Check mount boundaries and deleted-but-open files using lsof +L1. Release space through a controlled log rotation or process action; verify capacity and service health rather than deleting files blindly.

- Filesystem/inodes
- Deleted open files
- Safe mitigation and verification

Sources: https://man7.org/linux/man-pages/man1/df.1.html

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-09-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Pod Kubernetes không resolve được DNS của một Service. Bạn kiểm tra gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Kiểm tra tên Service, namespace và DNS từ một pod bằng nslookup hoặc dig. Xem resolv.conf, CoreDNS logs/endpoints và kết nối UDP/TCP 53 hoặc NetworkPolicy. Sửa đúng nguyên nhân rồi thử phân giải và gọi Service lại.

- Query DNS
- CoreDNS/service namespace
- Connectivity and verify

Sources: https://www.rfc-editor.org/rfc/rfc1034

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-10-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: How would you troubleshoot a pod in CrashLoopBackOff?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: CrashLoopBackOff indicates repeated restarts with backoff, not a root cause. Inspect events, container termination state and previous logs. Check application configuration, dependencies, resources and probes; apply a targeted fix and verify restart count and service health.

- Events/termination state
- Previous logs
- Cause-specific remediation and verify

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-11-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Một pod ở trạng thái Pending lâu. Bạn xử lý như thế nào?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Xem kubectl describe pod và scheduler events trước. Kiểm tra requests so với capacity, taints/tolerations, affinity và PVC chưa bound. Điều chỉnh đúng ràng buộc hoặc bổ sung capacity rồi xác nhận pod Scheduled, Running và Ready.

- Scheduler events
- Resources and constraints
- Verify scheduling/readiness

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-12-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Which kubectl commands would you use to check and roll back a Deployment rollout?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Use kubectl rollout status deployment/NAME and kubectl rollout history deployment/NAME to inspect progress and revisions. If rollback is appropriate, use kubectl rollout undo deployment/NAME with a known revision, then verify readiness and application health. Database changes may need a separate recovery plan.

- Rollout status
- Rollout history
- Rollback and verify

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-13-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Container Kubernetes bị OOMKilled. Có nên tăng memory limit ngay không?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Xem termination reason, memory metrics và log để phân biệt tải tăng với memory leak hoặc cấu hình sai. So sánh requests/limits và capacity node. Tăng limit có kiểm soát khi có bằng chứng và capacity; kiểm chứng usage, restart và sức khỏe ứng dụng sau thay đổi.

- Thu thập bằng chứng memory
- Limit/capacity or leak
- Verify after change

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-14-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Design a safe CI/CD deployment flow for a production API.

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Build and test one immutable artifact, scan it, and promote the same version through environments. Use staged rollout with readiness and application checks. Monitor errors and latency; stop or roll back to a known good artifact when thresholds fail, accounting for database compatibility.

- Same immutable artifact
- Staged delivery and tests
- Verification and rollback

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-15-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: GitLab CI khác Jenkins như thế nào, khi nào chọn mỗi công cụ?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: GitLab CI tích hợp pipeline với repository và dùng runners; Jenkins là automation server linh hoạt với plugin/agents và cần vận hành nhiều hơn. Chọn theo hệ sinh thái hiện có, nhu cầu tùy biến, bảo mật plugin và chi phí bảo trì, không chỉ số lượng tính năng.

- GitLab integration/runners
- Jenkins flexibility/plugins
- Operational choice

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-16-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: An AWS access key was committed to a public Git repository. What should you do?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Revoke or disable the exposed credential promptly and replace legitimate workloads with new credentials or roles. Investigate CloudTrail and access scope for abuse, preserve evidence and assess impact. Remove the secret from history and add scanning, but history cleanup alone does not revoke leaked copies.

- Revoke/rotate credential
- Investigate abuse
- History cleanup is insufficient

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-17-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Áp dụng least privilege cho ứng dụng chạy trên AWS như thế nào?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Dùng IAM role và credential tạm thời cho workload. Chỉ cấp action/resource cần thiết, bổ sung conditions phù hợp; kiểm tra Access Analyzer/CloudTrail để thu hẹp quyền. Xác minh ứng dụng vẫn hoạt động và thao tác ngoài phạm vi bị từ chối, không dùng AdministratorAccess để chữa lỗi.

- Role/temporary credentials
- Actions/resources narrowly scoped
- Verify/access review

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-18-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: As a senior DevOps engineer, design a highly available API on AWS and explain a trade-off.

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Start from availability, RTO/RPO and load requirements. Spread stateless compute behind a load balancer across Availability Zones with health checks and autoscaling; choose a suitable database HA mode. State failover and cost/consistency trade-offs, use reversible deployments, and test failover against SLOs rather than promising zero downtime.

- Requirements/SLO/RTO
- Multiple AZ/failure domains
- Trade-off and failure verification

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-19-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: SLI, SLO và SLA khác nhau như thế nào?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: SLI là chỉ số đo trải nghiệm dịch vụ, ví dụ tỷ lệ request thành công. SLO là mục tiêu cho chỉ số đó trong một cửa sổ thời gian. SLA là cam kết với khách hàng, thường có hậu quả hợp đồng khi vi phạm; ba khái niệm không đồng nghĩa.

- SLI measurement
- SLO objective/window
- SLA agreement/consequence

Sources: https://sre.google/sre-book/service-level-objectives/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-20-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: How would you reduce noisy Prometheus alerts without hiding real incidents?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Prefer actionable user-impact or SLO-based alerts, with meaningful duration and thresholds. Use Alertmanager grouping, deduplication and inhibition for related symptoms. Validate rules against incidents and test recovery; avoid silencing everything or using CPU alone as a universal paging signal.

- User impact/SLO
- Duration/grouping/deduplication
- Verify alert behavior

Sources: https://prometheus.io/docs/practices/alerting/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-21-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Idempotency trong Ansible nghĩa là gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Chạy lại cùng cấu hình nhiều lần vẫn hội tụ về trạng thái mong muốn mà không tạo thêm thay đổi không cần thiết. Ưu tiên module khai báo trạng thái; command hoặc shell không tự bảo đảm idempotency nếu không có điều kiện bảo vệ.

- Repeated convergence
- Desired state/no extra changes
- Module vs shell caveat

Sources: https://docs.ansible.com/ansible/latest/reference_appendices/glossary.html

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-22-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: A service fails TLS certificate validation. How do you investigate safely?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Inspect certificate validity dates, hostname/SAN and the full certificate chain using an appropriate TLS client. Check trust store, SNI and client clock. Repair the certificate or trust configuration and verify validation succeeds; disabling verification is not a production fix.

- Expiry/hostname/chain
- Trust store/SNI/clock
- Verify securely

Sources: https://www.rfc-editor.org/rfc/rfc8446

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-23-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Terraform plan bất ngờ muốn destroy database production. Bạn làm gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Dừng apply và giữ lại plan/state để điều tra. Kiểm tra workspace, backend, cấu hình, resource address, drift và thay đổi provider. Xác nhận backup/restore và dùng biện pháp migration/import phù hợp, review lại plan trước khi cho phép thay đổi; không force apply hay xóa state tùy tiện.

- Stop/review apply
- State/workspace/backend diagnosis
- Backup/recovery/change safety

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-24-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: A Kafka consumer processes the same payment event twice. How would you prevent duplicate effects?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Treat retries and redelivery as expected under at-least-once processing. Use a stable event or payment id and durable idempotency/deduplication around the side effect. Coordinate commit ordering and transactional/outbox patterns as appropriate; verify replay safety. Kafka transactions alone do not guarantee exactly-once effects in an external payment system.

- Redelivery/offset relationship
- Durable dedup/idempotency
- External side effects caveat/verification

Sources: https://kafka.apache.org/documentation/#semantics

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-25-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Một microservice gọi downstream chậm và gây timeout dây chuyền. Bạn xử lý thế nào?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Xác định dependency gây chậm bằng traces, latency và saturation. Giới hạn timeout theo deadline tổng, retry có giới hạn/backoff cho thao tác an toàn, dùng circuit breaker hoặc bulkhead để chặn lan truyền. Giảm tải có kiểm soát rồi xác minh error rate và p95/p99, tránh retry storm.

- Evidence/trace
- Timeout and bounded retries
- Containment and verify

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-26-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Are Kubernetes Secrets secure just because their values are base64 encoded?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: No. Base64 is encoding, not encryption. Restrict Secret access with RBAC and workload identities, enable appropriate encryption at rest, and protect transport and logs. Rotate exposed secrets and consider an external secret manager; verify access boundaries.

- Encoding is not encryption
- Access restriction
- Encryption/rotation/secret manager

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-27-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Hãy kể một sự cố production bạn đã trực tiếp xử lý với vai trò DevOps.

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Khi chưa có hồ sơ xác thực, trả một khung Adaptable answer với Situation, Task, Action, Result và chỗ trống để ứng viên điền sự kiện thật. Không tự nhận đã xử lý một sự cố hay bịa công ty, số liệu và kết quả.

- Adaptable label
- STAR outline
- Placeholders/no invented incident

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-28-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Tell me about your CI/CD experience based on the attached profile.

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Use only the supplied practice-project facts: built a GitLab CI pipeline for a personal Docker API, added tests and a manual staging deployment. Describe those actions and learning without claiming production ownership, employers or measured business improvements.

- GitLab practice project
- Tests/staging/manual deploy
- No invented production ownership

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-29-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: What if CPU requests are missing?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: In the preceding CPU-utilization HPA context, utilization is defined relative to CPU requests. Without relevant requests it cannot calculate that metric as intended. Set appropriate requests, confirm metrics availability and inspect HPA conditions; other metric types have different prerequisites.

- CPU utilization relative to requests
- Cannot calculate/missing metric
- Verify HPA/metrics

Sources: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-30-2

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Nếu bản rollout đó có migration database không tương thích thì sao?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Rollback Deployment chỉ đổi phiên bản workload, không tự phục hồi schema hoặc dữ liệu. Dừng rollout, đánh giá tương thích và chọn forward fix hoặc khôi phục đã được kiểm thử theo RPO/RTO. Ưu tiên expand/contract cho lần sau và xác minh dữ liệu cùng ứng dụng.

- Rollback does not restore schema
- Recovery/forward fix/compatibility
- Verify/RPO/RTO

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-01-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Docker là gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Docker đóng gói ứng dụng cùng phụ thuộc thành image và chạy thành container. Container là tiến trình được cô lập và chia sẻ kernel của host; image là khuôn đóng gói, khác với container đang chạy.

- Đóng gói ứng dụng và phụ thuộc
- Phân biệt image và container
- Cô lập tiến trình

Sources: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-02-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: What is the difference between a Docker image and a container?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: An image is a packaged, read-only template. A container is an instance created from it, with a writable layer and process lifecycle. Containers can be stopped; an existing image is not modified by writing inside one.

- Image là template
- Container là instance
- Writable layer hoặc lifecycle

Sources: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-03-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Kubernetes HPA là gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: HPA điều chỉnh số replica của workload dựa trên metrics như CPU, memory hoặc custom metrics. Nó scale pod theo chiều ngang; không tự tăng số node. Với CPU utilization, cần resource requests và nguồn metrics phù hợp.

- Scale replica/pod
- Dựa trên metrics
- Phân biệt node scaling

Sources: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-04-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: How do readiness and liveness probes differ in Kubernetes?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Readiness controls whether a pod receives service traffic. Liveness failures can restart a container. Startup probes protect slow initialization. A downstream dependency failure should not automatically trigger a restart loop; choose probe conditions and thresholds carefully.

- Readiness controls traffic
- Liveness restarts container
- Phân biệt failure action

Sources: https://kubernetes.io/docs/concepts/workloads/pods/probes/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-05-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Terraform state dùng để làm gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: State ánh xạ cấu hình Terraform tới tài nguyên thực và lưu metadata phục vụ plan. State có thể chứa dữ liệu nhạy cảm nên cần bảo vệ, backup, và dùng remote backend có locking phù hợp cho nhóm.

- Ánh xạ tài nguyên
- Plan hoặc metadata
- Bảo vệ state

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-06-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Compare Terraform and AWS CloudFormation. When would you choose each?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Terraform uses providers and supports multiple platforms, while CloudFormation is AWS-native and manages stacks through AWS. Choose based on platform coverage, team skills, state/stack operations, and integration needs; neither automatically eliminates drift or deployment risk.

- Terraform providers/platforms
- CloudFormation AWS-native
- Choice and trade-off

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-07-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Một commit lỗi đã được push lên nhánh chung. Nên dùng git revert hay reset?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Ưu tiên git revert để tạo commit đảo thay đổi mà không viết lại lịch sử dùng chung. Kiểm tra commit và chạy test trước khi merge/push. Reset phù hợp hơn với lịch sử local; force push nhánh chung cần quy trình phối hợp riêng.

- Ưu tiên revert
- Giữ lịch sử dùng chung
- Kiểm tra kết quả

Sources: https://git-scm.com/docs/git-revert

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-08-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: A Linux server reports disk full, but du shows little usage. How do you investigate?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Compare filesystem space and inode usage with df -h and df -i. Check mount boundaries and deleted-but-open files using lsof +L1. Release space through a controlled log rotation or process action; verify capacity and service health rather than deleting files blindly.

- Filesystem/inodes
- Deleted open files
- Safe mitigation and verification

Sources: https://man7.org/linux/man-pages/man1/df.1.html

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-09-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Pod Kubernetes không resolve được DNS của một Service. Bạn kiểm tra gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Kiểm tra tên Service, namespace và DNS từ một pod bằng nslookup hoặc dig. Xem resolv.conf, CoreDNS logs/endpoints và kết nối UDP/TCP 53 hoặc NetworkPolicy. Sửa đúng nguyên nhân rồi thử phân giải và gọi Service lại.

- Query DNS
- CoreDNS/service namespace
- Connectivity and verify

Sources: https://www.rfc-editor.org/rfc/rfc1034

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-10-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: How would you troubleshoot a pod in CrashLoopBackOff?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: CrashLoopBackOff indicates repeated restarts with backoff, not a root cause. Inspect events, container termination state and previous logs. Check application configuration, dependencies, resources and probes; apply a targeted fix and verify restart count and service health.

- Events/termination state
- Previous logs
- Cause-specific remediation and verify

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-11-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Một pod ở trạng thái Pending lâu. Bạn xử lý như thế nào?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Xem kubectl describe pod và scheduler events trước. Kiểm tra requests so với capacity, taints/tolerations, affinity và PVC chưa bound. Điều chỉnh đúng ràng buộc hoặc bổ sung capacity rồi xác nhận pod Scheduled, Running và Ready.

- Scheduler events
- Resources and constraints
- Verify scheduling/readiness

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-12-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Which kubectl commands would you use to check and roll back a Deployment rollout?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Use kubectl rollout status deployment/NAME and kubectl rollout history deployment/NAME to inspect progress and revisions. If rollback is appropriate, use kubectl rollout undo deployment/NAME with a known revision, then verify readiness and application health. Database changes may need a separate recovery plan.

- Rollout status
- Rollout history
- Rollback and verify

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-13-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Container Kubernetes bị OOMKilled. Có nên tăng memory limit ngay không?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Xem termination reason, memory metrics và log để phân biệt tải tăng với memory leak hoặc cấu hình sai. So sánh requests/limits và capacity node. Tăng limit có kiểm soát khi có bằng chứng và capacity; kiểm chứng usage, restart và sức khỏe ứng dụng sau thay đổi.

- Thu thập bằng chứng memory
- Limit/capacity or leak
- Verify after change

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-14-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Design a safe CI/CD deployment flow for a production API.

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Build and test one immutable artifact, scan it, and promote the same version through environments. Use staged rollout with readiness and application checks. Monitor errors and latency; stop or roll back to a known good artifact when thresholds fail, accounting for database compatibility.

- Same immutable artifact
- Staged delivery and tests
- Verification and rollback

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-15-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: GitLab CI khác Jenkins như thế nào, khi nào chọn mỗi công cụ?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: GitLab CI tích hợp pipeline với repository và dùng runners; Jenkins là automation server linh hoạt với plugin/agents và cần vận hành nhiều hơn. Chọn theo hệ sinh thái hiện có, nhu cầu tùy biến, bảo mật plugin và chi phí bảo trì, không chỉ số lượng tính năng.

- GitLab integration/runners
- Jenkins flexibility/plugins
- Operational choice

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-16-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: An AWS access key was committed to a public Git repository. What should you do?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Revoke or disable the exposed credential promptly and replace legitimate workloads with new credentials or roles. Investigate CloudTrail and access scope for abuse, preserve evidence and assess impact. Remove the secret from history and add scanning, but history cleanup alone does not revoke leaked copies.

- Revoke/rotate credential
- Investigate abuse
- History cleanup is insufficient

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-17-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Áp dụng least privilege cho ứng dụng chạy trên AWS như thế nào?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Dùng IAM role và credential tạm thời cho workload. Chỉ cấp action/resource cần thiết, bổ sung conditions phù hợp; kiểm tra Access Analyzer/CloudTrail để thu hẹp quyền. Xác minh ứng dụng vẫn hoạt động và thao tác ngoài phạm vi bị từ chối, không dùng AdministratorAccess để chữa lỗi.

- Role/temporary credentials
- Actions/resources narrowly scoped
- Verify/access review

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-18-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: As a senior DevOps engineer, design a highly available API on AWS and explain a trade-off.

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Start from availability, RTO/RPO and load requirements. Spread stateless compute behind a load balancer across Availability Zones with health checks and autoscaling; choose a suitable database HA mode. State failover and cost/consistency trade-offs, use reversible deployments, and test failover against SLOs rather than promising zero downtime.

- Requirements/SLO/RTO
- Multiple AZ/failure domains
- Trade-off and failure verification

Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-19-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: SLI, SLO và SLA khác nhau như thế nào?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: SLI là chỉ số đo trải nghiệm dịch vụ, ví dụ tỷ lệ request thành công. SLO là mục tiêu cho chỉ số đó trong một cửa sổ thời gian. SLA là cam kết với khách hàng, thường có hậu quả hợp đồng khi vi phạm; ba khái niệm không đồng nghĩa.

- SLI measurement
- SLO objective/window
- SLA agreement/consequence

Sources: https://sre.google/sre-book/service-level-objectives/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-20-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: How would you reduce noisy Prometheus alerts without hiding real incidents?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Prefer actionable user-impact or SLO-based alerts, with meaningful duration and thresholds. Use Alertmanager grouping, deduplication and inhibition for related symptoms. Validate rules against incidents and test recovery; avoid silencing everything or using CPU alone as a universal paging signal.

- User impact/SLO
- Duration/grouping/deduplication
- Verify alert behavior

Sources: https://prometheus.io/docs/practices/alerting/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-21-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Idempotency trong Ansible nghĩa là gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Chạy lại cùng cấu hình nhiều lần vẫn hội tụ về trạng thái mong muốn mà không tạo thêm thay đổi không cần thiết. Ưu tiên module khai báo trạng thái; command hoặc shell không tự bảo đảm idempotency nếu không có điều kiện bảo vệ.

- Repeated convergence
- Desired state/no extra changes
- Module vs shell caveat

Sources: https://docs.ansible.com/ansible/latest/reference_appendices/glossary.html

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-22-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: A service fails TLS certificate validation. How do you investigate safely?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Inspect certificate validity dates, hostname/SAN and the full certificate chain using an appropriate TLS client. Check trust store, SNI and client clock. Repair the certificate or trust configuration and verify validation succeeds; disabling verification is not a production fix.

- Expiry/hostname/chain
- Trust store/SNI/clock
- Verify securely

Sources: https://www.rfc-editor.org/rfc/rfc8446

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-23-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Terraform plan bất ngờ muốn destroy database production. Bạn làm gì?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Dừng apply và giữ lại plan/state để điều tra. Kiểm tra workspace, backend, cấu hình, resource address, drift và thay đổi provider. Xác nhận backup/restore và dùng biện pháp migration/import phù hợp, review lại plan trước khi cho phép thay đổi; không force apply hay xóa state tùy tiện.

- Stop/review apply
- State/workspace/backend diagnosis
- Backup/recovery/change safety

Sources: https://developer.hashicorp.com/terraform/language/state

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-24-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: A Kafka consumer processes the same payment event twice. How would you prevent duplicate effects?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Treat retries and redelivery as expected under at-least-once processing. Use a stable event or payment id and durable idempotency/deduplication around the side effect. Coordinate commit ordering and transactional/outbox patterns as appropriate; verify replay safety. Kafka transactions alone do not guarantee exactly-once effects in an external payment system.

- Redelivery/offset relationship
- Durable dedup/idempotency
- External side effects caveat/verification

Sources: https://kafka.apache.org/documentation/#semantics

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-25-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Một microservice gọi downstream chậm và gây timeout dây chuyền. Bạn xử lý thế nào?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Xác định dependency gây chậm bằng traces, latency và saturation. Giới hạn timeout theo deadline tổng, retry có giới hạn/backoff cho thao tác an toàn, dùng circuit breaker hoặc bulkhead để chặn lan truyền. Giảm tải có kiểm soát rồi xác minh error rate và p95/p99, tránh retry storm.

- Evidence/trace
- Timeout and bounded retries
- Containment and verify

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-26-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Are Kubernetes Secrets secure just because their values are base64 encoded?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: No. Base64 is encoding, not encryption. Restrict Secret access with RBAC and workload identities, enable appropriate encryption at rest, and protect transport and logs. Rotate exposed secrets and consider an external secret manager; verify access boundaries.

- Encoding is not encryption
- Access restriction
- Encryption/rotation/secret manager

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-27-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Hãy kể một sự cố production bạn đã trực tiếp xử lý với vai trò DevOps.

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Khi chưa có hồ sơ xác thực, trả một khung Adaptable answer với Situation, Task, Action, Result và chỗ trống để ứng viên điền sự kiện thật. Không tự nhận đã xử lý một sự cố hay bịa công ty, số liệu và kết quả.

- Adaptable label
- STAR outline
- Placeholders/no invented incident

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-28-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Tell me about your CI/CD experience based on the attached profile.

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Use only the supplied practice-project facts: built a GitLab CI pipeline for a personal Docker API, added tests and a manual staging deployment. Describe those actions and learning without claiming production ownership, employers or measured business improvements.

- GitLab practice project
- Tests/staging/manual deploy
- No invented production ownership

Sources: docs/14-devops-role-spec.md

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-29-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: What if CPU requests are missing?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: In the preceding CPU-utilization HPA context, utilization is defined relative to CPU requests. Without relevant requests it cannot calculate that metric as intended. Set appropriate requests, confirm metrics availability and inspect HPA conditions; other metric types have different prerequisites.

- CPU utilization relative to requests
- Cannot calculate/missing metric
- Verify HPA/metrics

Sources: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none

### audio-devops-30-3

Status: **not_run**; quality: **not_evaluated**; screening: n/a/100; reviewed score: n/a/100.

Question: Nếu bản rollout đó có migration database không tương thích thì sao?

Transcript: not measured (text path or not run)

Answer: (no answer)

Reference: Rollback Deployment chỉ đổi phiên bản workload, không tự phục hồi schema hoặc dữ liệu. Dừng rollout, đánh giá tương thích và chọn forward fix hoặc khôi phục đã được kiểm thử theo RPO/RTO. Ưu tiên expand/contract cho lần sau và xác minh dữ liệu cùng ứng dụng.

- Rollback does not restore schema
- Recovery/forward fix/compatibility
- Verify/RPO/RTO

Sources: https://kubernetes.io/docs/tasks/debug/debug-application/

Metrics: {"sttMs":null,"providerFirstTokenMs":null,"providerTotalMs":null,"answerPreparationMs":null,"requestToFirstTokenMs":null,"requestToCompletedMs":null,"speechEndToFirstVisibleMs":null}
Error: none
