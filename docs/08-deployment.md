# Deployment and Operation Guide

This guide covers the currently supported local deployment, Chrome Extension
installation, end-to-end operation, verification, and the required path toward
a staging or production deployment.

For a Linux-first command-by-command setup guide, see
[RUN_LINUX.md](../RUN_LINUX.md).

## Current deployment status

The implemented product currently reaches the initial Phase 13 role expansion:

- tab-audio capture, VAD, transcription, automatic answers, SSE streaming, and
  bounded conversation context are implemented;
- interview sessions, ordered messages, transcription metadata, answer context,
  and latency records are persisted in PostgreSQL;
- versioned database migrations run before the backend starts;
- per-interview bearer authorization, Redis rate limiting, strict production
  configuration, protected metrics, and provider retry/timeouts are implemented;
- the runtime image contains production dependencies only and runs as the
  unprivileged `node` user.
- curated DevOps and DBA knowledge is indexed explicitly into pgvector and is
  added only when the session role, retrieved topic, and similarity are relevant.
- a per-interview CV/profile and optional job description can supply verified
  candidate facts without storing raw upload files.
- the session can be created for either DevOps or DBA; its role controls STT
  vocabulary, classification, prompt policy, and RAG retrieval.

Therefore:

- **local development and a hardened self-hosted deployment are supported by
  the application code**;
- **the current root Compose file and backend image must not be exposed directly
  to the public internet**;
- a deployment must not be described as production-ready until every applicable
  item in [the release checklist](12-release-checklist.md) passes.

Restarting the backend retains stored sessions and chat history. An active SSE
connection is process-local and the extension reconnects after interruption.
An answer interrupted by process termination remains failed/incomplete and must
be retried; multi-instance SSE fan-out still requires an external event bus.

## Runtime architecture

### Local

```text
Chrome Extension loaded from extension/dist
                |
                | HTTP REST + SSE
                v
       http://localhost:3000
          NestJS backend
          /             \
 OpenAI STT             OpenAI LLM

PostgreSQL is the source of truth. Redis is mandatory when production rate
limiting is enabled and optional only for local development.
```

### Production target

```text
Published Chrome Extension
            |
            | HTTPS REST + SSE
            v
Reverse proxy / managed load balancer
            |
            v
Private NestJS backend instances
      |          |             |
PostgreSQL   Redis rate limit   STT/LLM providers
```

Use a single VM, ECS/Fargate, or Kubernetes according to operational needs. Do
not introduce Kubernetes only for portfolio value; it adds cluster, ingress,
certificate, secret, policy, upgrade, backup, and observability ownership.

## Prerequisites for local use

- Git.
- Docker Desktop or Docker Engine with Docker Compose v2.
- Docker Desktop WSL integration enabled when commands run inside WSL.
- Node.js 22 and npm for building the extension on the host.
- A Chromium-based browser that supports Manifest V3 Side Panel and tab capture.
- A real STT API key. The runtime has no mock transcription provider.
- An OpenAI API key with access to the configured LLM and STT models.

Run the commands below from the repository root unless another directory is
shown explicitly.

## 1. Configure the backend

Create the uncommitted root environment file:

```bash
cp .env.example .env
```

On Windows Command Prompt, use:

```bat
copy .env.example .env
```

### OpenAI for both LLM and STT

```dotenv
NODE_ENV=development
PORT=3000

LLM_PROVIDER=openai
LLM_API_KEY=<your-backend-only-openai-key>
LLM_MODEL=gpt-6.1-sol
LLM_TIMEOUT_MS=15000
LLM_MAX_RETRIES=2
# Fast, concise live-interview defaults. These remain backend-only.
LLM_REASONING_EFFORT=low
LLM_MAX_OUTPUT_TOKENS=600
LLM_VERBOSITY=low
# Lower-latency model for definition/comparison/command questions only.
# Complex interview turns remain on gpt-6.1-sol.
LLM_ROUTINE_MODEL=gpt-6-luna
LLM_ROUTINE_REASONING_EFFORT=low
LLM_ROUTINE_MAX_OUTPUT_TOKENS=320
LLM_ROUTINE_VERBOSITY=low

STT_PROVIDER=openai
STT_API_KEY=<your-backend-only-openai-key>
# Quality-first technical interview transcription (supports en/vi hints)
STT_MODEL=gpt-transcribe
# Fallback only when a client omits its language hint; V1 supports vi/en
STT_LANGUAGE=en
STT_TIMEOUT_MS=20000
STT_MAX_RETRIES=2
```

The LLM and STT keys may be different credentials. Give each credential only
the access it requires.

For selecting and evaluating the answer-generation model without exposing
credentials to the extension, see [LLM model selection](16-llm-model-selection.md).

### Local infrastructure and request limits

Keep these values from `.env.example` unless the local topology changes:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/agent_interview
REDIS_URL=redis://redis:6379
STT_MAX_AUDIO_BYTES=10485760
STT_MAX_DURATION_MS=31000
CANDIDATE_CONTEXT_MAX_BYTES=2097152
CANDIDATE_CONTEXT_MAX_CHARACTERS=30000
CANDIDATE_CONTEXT_PROMPT_MAX_CHARACTERS=8000
CORS_ORIGINS=http://localhost:5173,chrome-extension://YOUR_EXTENSION_ID
RATE_LIMIT_ENABLED=false
SWAGGER_ENABLED=true
METRICS_ENABLED=false
LOG_LEVEL=info
```

Local development may disable rate limiting and metrics. Production mode rejects
that profile: enable both, supply a long random `METRICS_BEARER_TOKEN`, and keep
Redis reachable.

Never place `LLM_API_KEY`, `STT_API_KEY`, `METRICS_BEARER_TOKEN`, or database credentials
in `extension/.env`, browser storage, client JavaScript, or a committed file.

## 2. Start the local backend stack

Validate the resolved Compose configuration without printing or sharing its
output when it contains secrets:

```bash
docker compose config --quiet
```

Build and start the services:

```bash
docker compose up --build -d
```

Check status and backend logs:

```bash
docker compose ps
docker compose logs -f backend
```

The Compose health order is:

1. PostgreSQL and Redis become healthy.
2. The backend applies pending SQL migrations under an advisory lock.
3. The backend starts.
4. The backend readiness endpoint verifies PostgreSQL and makes the container healthy.

Verify the API from the host:

```bash
curl http://localhost:3000/api/v1/health/live
curl http://localhost:3000/api/v1/health/ready
```

Expected responses:

```json
{"status":"ok"}
```

```json
{"status":"ok","checks":{"application":"ok","database":"ok","rateLimit":"disabled"}}
```

The local profile reports rate limiting as disabled. With
`RATE_LIMIT_ENABLED=true`, readiness also pings Redis and reports `rateLimit:
"ok"`; a Redis failure makes readiness fail. It intentionally does not call
paid STT/LLM providers.

### Phase 10 knowledge index

Compose uses the pgvector PostgreSQL image and packages the repository's
`knowledge/` directory into the backend image. After the backend is healthy,
run this explicit, backend-only operation whenever curated knowledge changes:

```bash
docker compose exec backend npm run knowledge:index
```

`EMBEDDING_API_KEY` is optional only when the backend's `LLM_API_KEY` has
embedding access; otherwise supply it in the uncommitted root `.env`.
`EMBEDDING_MODEL=text-embedding-3-small`, `RAG_MAX_CHUNKS=4`,
`RAG_MIN_SIMILARITY=0.72`, and `RAG_MIN_KEYWORD_COVERAGE=0.35` are the V1
defaults. The job can incur embedding API
cost. It never runs automatically at startup and does not retain audio. If the
index is absent or relevance is low, answers fall back to normal LLM knowledge.

Swagger is available locally at:

```text
http://localhost:3000/api/docs
```

### Phase 11 CV and JD context

After starting an interview session, open **Profile context** in the Side Panel
and attach a text-based PDF, TXT, or Markdown CV; attach a JD when preparing
for a specific role. The file travels only to the authenticated backend. Raw
bytes are discarded after text extraction, while normalized text is retained in
PostgreSQL with that interview so later turns can use verified facts. Replacing
an upload replaces its stored text; **Remove** deletes that context immediately.
These are personal documents: do not use a shared database profile if that
retention is not intended.

## 3. Build the Chrome Extension

The extension runs in Chrome, so build it on the host rather than inside the
backend Compose stack:

```bash
cd extension
cp .env.example .env
npm ci
npm run lint
npm test
npm run build
```

For the local build, `extension/.env` contains only:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Confirm `extension/public/manifest.json` contains the matching host permission:

```json
"host_permissions": ["http://localhost:3000/*"]
```

`npm run dev` can be useful for ordinary UI work, but real Side Panel,
`activeTab`, and `tabCapture` behavior must be tested from the built unpacked
extension. After a source change, rebuild and reload the extension in Chrome.

## 4. Load the extension into Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the repository's `extension/dist` directory.
5. Copy the generated extension ID.
6. Pin **Agent Interview** if desired.

Do not select `extension/` itself. Chrome must load the generated directory that
contains `manifest.json` at its root.

## 5. Allow the extension origin in the backend

Replace the placeholder in the root `.env`:

```dotenv
CORS_ORIGINS=http://localhost:5173,chrome-extension://<actual-extension-id>
```

Changing `.env` requires recreating the backend container. A plain Compose
restart does not load a changed environment file:

```bash
docker compose up -d --force-recreate backend
```

Recheck:

```bash
docker compose ps
curl http://localhost:3000/api/v1/health/ready
```

If the extension is removed and loaded from a different unpacked location, its
ID can change; update CORS and recreate the backend again.

## 6. Run an interview session

1. Open a normal interview web page such as a Google Meet tab. Chrome internal
   pages such as `chrome://extensions` cannot be captured.
2. Click the **Agent Interview** toolbar icon while the interview tab is active.
3. Select **DevOps** or **DBA**, then select **Start session**. The extension
   creates a role-bound interview and opens its SSE connection. The role is
   locked until the session ends.
4. Select **Start capture**.
5. In Chrome's picker, select only the interview tab and enable **Share tab
   audio**.
6. Let the interviewer speak, then leave enough silence for VAD finalization.
7. Confirm the UI transitions through listening/speech/finalizing and then
   displays:
   - a temporary `Transcribing…` interviewer bubble;
   - the final transcript;
   - a correlated AI Assistant bubble receiving streamed tokens.
8. Ask a second question while the first answer is streaming to verify that the
   two question/answer pairs remain ordered and do not share tokens.
9. Select **Stop capture**, then **End session** when finished.

Tab capture records the user-authorized tab audio, not the microphone. The raw
audio segment is kept only long enough to upload/transcribe and is not stored by
default by the extension or backend.

## 7. Local end-to-end acceptance checks

Verify all of the following before considering the local setup successful:

- `/health/live` and `/health/ready` return HTTP 200.
- Swagger loads and documents the health, interview, event, and transcription
  endpoints.
- **Start session** reaches Connected instead of `Failed to fetch`.
- Chrome shows the tab picker and an audio track exists after selection.
- silence-only input does not create a question;
- one spoken utterance creates one final transcript;
- the transcript text matches the spoken question closely enough for the
  interview task;
- the final transcript automatically starts one AI answer;
- tokens appear incrementally rather than as one completed block;
- question/answer IDs preserve overlapping-turn ordering;
- retryable transcription or answer failures keep the transcript and expose the
  correct retry action;
- Stop Capture releases the track and returns to a stopped state;
- provider keys are absent from extension source, `.env`, `dist`, and browser
  developer tools.

Provider requests incur cost or quota except where the selected provider states
otherwise. Use short, intentional smoke tests.

## 8. Run automated verification

Backend:

```bash
cd backend
npm ci
npm run lint
npm test
npm run build
```

Run the real PostgreSQL persistence test against the local Compose database
from `backend/`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_interview npm run db:migrate
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_interview RUN_DATABASE_TESTS=true \
  npx jest src/persistence/postgres-interview.repository.spec.ts --runInBand
```

In PowerShell, set the two environment variables in the session first, then run
the same npm/npx commands. The normal test suite skips this database-backed test
unless `RUN_DATABASE_TESTS=true`; its fixture deletes only the interview UUID
it creates.

Verify the real Redis limiter from `backend/`:

```bash
REDIS_URL=redis://localhost:6379 RATE_LIMIT_ENABLED=true RUN_REDIS_TESTS=true \
  npx jest src/security/rate-limit.service.spec.ts --runInBand
npm audit --omit=dev
```

Extension:

```bash
cd extension
npm ci
npm run lint
npm test
npm run build
```

The deterministic test doubles are test-only. Passing automated tests does not
prove that real provider credentials, quota, network access, audio capture, or
Chrome permissions work; complete the manual audio-path test as well.

## 9. Stop, reset, and update local services

Stop containers while retaining the PostgreSQL volume:

```bash
docker compose down
```

Remove containers and local database data only when a destructive reset is
intentional:

```bash
docker compose down -v
```

`down -v` permanently deletes the Compose-managed PostgreSQL volume. It is not
needed for a normal restart.

After backend code or dependency changes:

```bash
docker compose build backend
docker compose up -d backend
docker compose logs -f backend
```

After extension changes:

```bash
cd extension
npm run build
```

Then open `chrome://extensions` and select **Reload** on Agent Interview. Close
and reopen the Side Panel so its old runtime state and authenticated SSE fetch
are removed.

## Backend environment reference

| Variable | Purpose | Secret | Current note |
| --- | --- | --- | --- |
| `NODE_ENV` | Runtime mode | No | Use `development` locally and `production` only in a hardened deployment |
| `PORT` | Backend listen port | No | Defaults to `3000` |
| `LLM_PROVIDER` | Runtime LLM provider | No | Must be `openai`; no runtime mock provider |
| `LLM_API_KEY` | OpenAI LLM credential | Yes | Backend only |
| `LLM_MODEL` | OpenAI LLM model | No | Validate availability before release |
| `LLM_TIMEOUT_MS` | LLM request timeout | No | Applies to configured LLM provider |
| `LLM_MAX_RETRIES` | Safe initial provider retries | No | Defaults to `2`; streamed output is not replayed by application code |
| `LLM_REASONING_EFFORT` | Primary-model reasoning depth | No | `minimal`, `low`, `medium`, or `high`; use `low` for responsive interview answers and measure difficult scenarios before lowering further |
| `LLM_MAX_OUTPUT_TOKENS` | Upper bound for visible and reasoning tokens | No | `600` bounds latency/cost while allowing the answer plans in this project; a too-low limit can create an incomplete response |
| `LLM_VERBOSITY` | Requested answer detail | No | `low`, `medium`, or `high`; the prompt still enforces the required technical answer points |
| `LLM_ROUTINE_MODEL` | Faster model for routine questions | No | Used only for definitions, comparisons, and commands; incidents, scenarios, architecture, and experience stay on `LLM_MODEL` |
| `LLM_ROUTINE_REASONING_EFFORT` | Routine-model reasoning depth | No | Overrides the primary reasoning setting for the routine path only |
| `LLM_ROUTINE_MAX_OUTPUT_TOKENS` | Routine-model output budget | No | Keep sufficient for the requested word range; `320` is the tested starting point for concise answers |
| `LLM_ROUTINE_VERBOSITY` | Routine-model answer detail | No | Usually `low` for spoken live-interview answers |
| `STT_PROVIDER` | STT provider selection | No | Current runtime supports OpenAI |
| `STT_API_KEY` | STT credential | Yes | Backend only |
| `STT_MODEL` | Transcription model | No | Validate supported audio behavior |
| `STT_LANGUAGE` | Fallback transcription language | No | `en` for English (default) or `vi` for Vietnamese; the extension's per-segment selection takes precedence |
| `STT_TIMEOUT_MS` | STT request timeout | No | Defaults from configuration |
| `STT_MAX_RETRIES` | STT provider retries | No | Defaults to `2`; segment ID keeps successful uploads idempotent |
| `STT_MAX_AUDIO_BYTES` | Upload byte limit | No | Proxy limit must be at least this large |
| `STT_MAX_DURATION_MS` | Declared segment duration limit | No | Keep aligned with VAD maximum utterance |
| `DATABASE_URL` | PostgreSQL connection | Yes | Required by migrations and the persistence repository |
| `REDIS_URL` | Redis connection | Yes | Required when rate limiting is enabled |
| `CORS_ORIGINS` | Exact allowed browser origins | No | Include the exact extension origin |
| `RATE_LIMIT_ENABLED` | Distributed request limiting | No | Must be `true` in production |
| `RATE_LIMIT_*` | Window and route limits | No | Tune against expected interview traffic |
| `TRUST_PROXY_HOPS` | Trusted reverse-proxy hops | No | Set only to the exact deployed topology |
| `SWAGGER_ENABLED` | Expose Swagger | No | Defaults off in production behavior |
| `METRICS_ENABLED` | Expose Prometheus metrics | No | Must be `true` in production |
| `METRICS_BEARER_TOKEN` | Metrics scrape credential | Yes | Backend/monitoring only; never the extension |
| `LOG_LEVEL` | Logging level | No | Avoid debug output containing sensitive context in production |

## Extension environment reference

The only supported extension variable is public:

```dotenv
VITE_API_BASE_URL=https://api.example.com/api/v1
```

Vite variables are bundled into client JavaScript. Never add provider keys,
database credentials, authentication signing secrets, or unrestricted tokens to
an extension environment file.

## Staging and production deployment procedure

The following platform work is still required in addition to the implemented
Phase 9 code. Passing the release checklist for a specific environment is what
makes that deployment production-ready.

### 1. Create an immutable backend release

- Run lint, tests, build, integration tests, and answer-quality evaluation.
- Build the backend image in CI and tag it with a version plus immutable digest.
- Generate scan results and provenance/SBOM according to organization policy.
- Promote the same image digest to staging and production; do not rebuild it per
  environment.
- Verify the multi-stage runtime image has zero production dependency audit
  findings and runs as the non-root `node` user.

### 2. Provision infrastructure

- Use private backend/database/cache networking.
- Do not publish PostgreSQL or Redis ports to the internet and do not reuse the
  local `postgres/postgres` credentials.
- Configure managed or tested PostgreSQL backups, restore exercises, migrations,
  connection limits/pooling, restricted roles, encryption, and monitoring.
- Use Redis only for an implemented, justified workload and define its
  durability/failure behavior.
- Provide at least the availability and capacity required by the service SLO.

### 3. Inject secrets server-side

- Store provider/database/authentication values in the deployment platform's
  secret manager.
- Grant the backend workload identity only the secrets and infrastructure access
  it requires.
- Do not bake secrets into the image, Dockerfile, Compose file, CI logs, Chrome
  extension, or Git repository.
- Define rotation and revocation procedures before go-live.

### 4. Deploy the backend privately

- Set `NODE_ENV=production` and deploy the immutable image digest.
- Apply reviewed database migrations before or during rollout according to a
  backward-compatible expand/contract plan.
- Configure startup/liveness/readiness behavior. Current readiness checks the
  application, PostgreSQL, and Redis whenever production rate limiting is
  enabled.
- Use rolling, blue/green, or canary rollout with an explicit halt and rollback
  threshold.

### 5. Configure HTTPS and SSE at the edge

The load balancer/reverse proxy must provide:

- a valid public TLS certificate and HTTPS-only API access;
- disabled response buffering/caching for SSE;
- an SSE read timeout longer than the expected interview session;
- request streaming/flush behavior that does not accumulate answer tokens;
- a request-body limit greater than or equal to `STT_MAX_AUDIO_BYTES` plus
  multipart overhead;
- request IDs, access logs with redaction, and appropriate network controls.

An illustrative Nginx location is:

```nginx
client_max_body_size 11m;

location /api/ {
    proxy_pass http://backend:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Request-ID $request_id;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 3600s;
}
```

This is a behavior example, not a drop-in production configuration. Adapt DNS,
upstream discovery, trusted proxy handling, timeouts, TLS, logs, and security
headers to the selected platform.

### 6. Configure strict origin access and API protection

- Set `CORS_ORIGINS` to the exact published extension origin, for example
  `chrome-extension://<chrome-web-store-extension-id>`.
- Do not use wildcard CORS with credentialed or sensitive endpoints.
- Verify interview bearer authorization and Redis rate limiting in staging;
  add an identity-aware edge/per-user quota before broader public use.
- Protect or disable Swagger in production according to policy.
- Treat CORS as a browser control, not authentication.

### 7. Build the production extension

Create an environment-specific extension build:

```dotenv
VITE_API_BASE_URL=https://api.example.com/api/v1
```

Change the manifest host permission to the same narrow origin:

```json
"host_permissions": ["https://api.example.com/*"]
```

Then run:

```bash
cd extension
npm ci
npm run lint
npm test
npm run build
```

Inspect the generated manifest and bundle. Confirm that only the intended API
origin is allowed and no backend/provider secret is present. Package the
contents of `extension/dist` so `manifest.json` is at the archive root, then
submit through the approved Chrome Web Store or enterprise distribution flow.

Chrome Web Store publication also requires accurate permission justification,
privacy disclosures, data-use/retention statements, branding assets, and review.
The published extension ID is stable and must be added to backend CORS before
the release becomes usable.

### 8. Staging smoke test

Run with production-equivalent networking and configuration:

1. Verify live and ready endpoints through the public HTTPS route.
2. Verify Swagger exposure matches policy.
3. Create an interview and keep SSE connected through the edge timeout.
4. Capture a permitted test tab and transcribe a short known question.
5. Confirm incremental tokens, completion, and stable correlation IDs.
6. Exercise two overlapping questions.
7. Exercise retryable STT/LLM failure behavior.
8. Stop capture/session and confirm cleanup.
9. Review redacted logs and latency metrics.
10. Test the documented backend and extension rollback paths.

### 9. Production rollout and rollback

- Start with a controlled cohort/canary when the platform permits it.
- Watch request error rate, STT errors/latency, LLM first-token latency,
  speech-end-to-first-answer latency, SSE disconnects, saturation, and provider
  quota/rate limits.
- Halt or roll back when an agreed user-facing threshold is breached.
- Backend rollback must deploy the last known-good image/configuration and use a
  database-compatible release. A database restore is not a routine application
  rollback.
- Extension rollback is slower because clients update through Chrome
  distribution. Keep the backend API backward-compatible with supported
  extension versions and use staged extension rollout where available.
- After rollback, verify the original symptom and all critical user paths; do
  not rely only on deployment status.

## GitHub Actions deployment to one Linux server

The repository includes `.github/workflows/deploy-backend.yml`. It is a
single-server source-sync delivery path for the backend, not a claim of high
availability. On a push to `main` that changes backend code, curated knowledge,
the server Compose manifest, the Docker build context, or the workflow, it:

1. runs backend `lint`, tests, and build;
2. synchronises the checked-out source to the dedicated server directory;
3. excludes `extension/`, every `.env` file, Git metadata, dependencies, build
   output, coverage, and logs;
4. instructs the server to run `docker compose build backend` then `up -d`;
5. waits for readiness and refreshes the knowledge index.

The server builds from the exact repository commit checked out by that workflow
run. This is intentionally a source-sync deployment for a private single-server
setup. It is simpler than a registry release, but less reproducible than
promoting an immutable CI-built image. The workflow pins GitHub Actions by full
commit SHA and uses strict SSH host-key checking.

### What CI/CD actually puts on the server

```text
repository push (backend/ or knowledge/ changes)
                 |
                 v
GitHub Actions: lint -> test -> build -> rsync server-side source
                 |
                 v
Linux server: docker compose build backend -> up -d
                 |
                 +-- PostgreSQL volume (persistent data)
                 +-- Redis
                 +-- backend container
```

The Chrome Extension/frontend is deliberately not copied to the server. Build
`extension/dist` separately on the Chrome user's machine with only public
`VITE_API_BASE_URL`. Provider credentials remain only in server-side
`.env.server` or a secret manager.

`backend/Dockerfile` copies `knowledge/` into `/app/knowledge` during the local
server build. A knowledge-only commit therefore synchronises `knowledge/`,
rebuilds backend, then runs `npm run knowledge:index` against the persistent
PostgreSQL/pgvector database.

### Prepare the server once

Use a dedicated non-root deployment account with SSH key authentication. The
account must be permitted to run Docker Compose; membership in the Docker group
is effectively privileged access, so restrict SSH access and protect that key.
Install Docker Engine and Docker Compose v2, create an explicit deployment
directory, and leave database and Redis ports unpublished. A reverse proxy on
the same host may forward HTTPS/SSE traffic to `127.0.0.1:3000`.

Copy the server environment template once, then keep it only on the server:

```bash
scp .env.server.example deploy@SERVER:/opt/agent-interview/.env.server
ssh deploy@SERVER
chmod 600 /opt/agent-interview/.env.server
editor /opt/agent-interview/.env.server
```

Replace every placeholder, use a strong distinct PostgreSQL password and
metrics token, URL-encode reserved characters only in `DATABASE_URL`, set the
exact extension origin in `CORS_ORIGINS`, and keep this file out of Git. The
workflow deliberately excludes it from synchronisation.

### Configure GitHub before the first deployment

Create a GitHub Environment named `production`. Restrict it to the `main`
branch and enable required review when appropriate. Add these environment
secrets, never repository files:

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | Server DNS name or IP address. |
| `DEPLOY_USER` | Dedicated deployment account name. |
| `DEPLOY_PATH` | Absolute directory, for example `/opt/agent-interview`. |
| `DEPLOY_SSH_PRIVATE_KEY` | Private key whose public half is in the server account's `authorized_keys`. |
| `DEPLOY_KNOWN_HOSTS` | Verified `known_hosts` line for the server SSH host key. |

Obtain the host-key value from a trusted console/fingerprint check; do not
blindly trust `ssh-keyscan` from an unverified network. No container-registry
credential is required by this workflow. The server still needs access to the
configured base image and npm registry during its Docker build.

### Deployment and rollback behavior

The workflow synchronises source while excluding every `.env` file, including
`.env.server`; it never changes server-side secrets. PostgreSQL and Redis remain
on the Compose network and backend port 3000 binds to loopback. Put a TLS-aware
reverse proxy in front of that loopback port and configure SSE buffering/timeouts
as described above.

The knowledge index runs after readiness. An invalid embedding credential or
indexing failure makes the workflow fail visibly, while the newly started backend
remains available. Correct the credential, run the index again, and confirm RAG
logs before declaring the knowledge update complete.

### Manual server rebuild

Use this only for an emergency or before GitHub Actions is configured. Copy
only server-side source (`backend/`, `knowledge/`, `docker-compose.server.yml`
and root Docker build files) to the dedicated directory. Do not upload
`extension/`, local `.env`, or provider keys. Then build/restart locally:

```bash
ssh deploy@SERVER
cd /opt/agent-interview

docker compose --env-file .env.server -f docker-compose.server.yml build --pull backend
docker compose --env-file .env.server -f docker-compose.server.yml up -d --no-build --remove-orphans
docker compose --env-file .env.server -f docker-compose.server.yml exec -T backend npm run knowledge:index
```

`docker compose up -d` alone does not rebuild source changes. Run `build` first,
then `up -d --no-build`. The local image stays only on this server; it is never
pushed to a registry.

For rollback, rerun a known-good completed GitHub Actions workflow from the
desired commit, or copy that reviewed source revision to the deployment
directory, then build and restart it. Only roll back to a release whose
migrations remain compatible with the current database. Re-run health checks, a
permitted interview smoke test, and relevant knowledge indexing deliberately; a
database restore is not the normal rollback mechanism.

## Common deployment failures

### Side Panel shows `Failed to fetch`

Check backend health, `VITE_API_BASE_URL`, manifest `host_permissions`, exact
extension ID in `CORS_ORIGINS`, browser console, HTTPS certificate, and whether
the backend container was recreated after changing `.env`.

### Capture permission or capture error

Open the Side Panel from the active normal interview tab, use Chrome's picker,
select that tab, and enable **Share tab audio**. Site microphone permission is
not the permission used for tab audio capture. Chrome internal pages cannot be
captured.

### Transcription reports unsupported content type

Confirm the built extension is current. The current capture pipeline produces
`audio/wav` from PCM samples; a stale extension can still send an older format.
Verify the backend allowlist in [the API contract](05-api-contract.md), then
rebuild and reload the extension after audio-format changes.

### Transcript is wrong

Check that the selected tab actually contains interviewer audio, the audio track
is live, only one intended source is captured, VAD is not clipping the utterance,
and the configured STT model/language behavior matches the recording. Do not
compensate by inventing the interview question in the LLM prompt.

### Transcript exists but no answer arrives

Check LLM credentials/model/quota, backend `answer.error` logs, SSE connection,
proxy buffering/read timeout, and correlation IDs. Use **Retry answer** for a
retryable answer error; do not re-upload the same audio.

See [the operations runbook](11-runbook.md) for incident-oriented diagnosis and
[the testing strategy](10-testing.md) for complete verification coverage.
