# Production Roadmap

## Documentation discipline

Every implementation change must update the applicable documentation in the same change set. In particular, keep product scope, architecture, API contracts, environment variables, Docker Compose/local runtime, testing instructions, runbook, and release checklist aligned with the code.

Do not mark a roadmap phase complete until its code and affected documentation have both been updated and verified.

## Phase 1 - Core backend
- NestJS
- Swagger
- deterministic LLM test double outside production source
- real LLM provider abstraction
- text question
- SSE
- Interview Intelligence Layer skeleton

## Phase 2 - Extension shell
- Side Panel
- session lifecycle
- chat UI
- manual dev question
- SSE integration

Phase 2 implementation uses a Manifest V3 Side Panel, React/Vite/TypeScript, the Phase 1 text-question endpoints, and a development-only manual question form. Audio capture, STT, VAD, and RAG are intentionally excluded.

## Phase 3 - Tab audio capture
- explicit tab capture
- capture lifecycle
- local audio monitoring/debug

Phase 3 implements explicit active-tab capture with `activeTab` and `tabCapture`, local stream/track/sample-rate diagnostics, and cleanup on stop, unmount, track end, tab close, and navigation. It intentionally does not send or persist audio.

## Phase 4 - VAD and segmentation
- speech start/end
- audio segments

Phase 4 adds configured RMS voice activity detection, pre-roll/post-roll utterance segmentation, silence-only rejection, single-finalization protection, and duration-only development diagnostics. It produces local in-memory segments only; STT begins in Phase 5.

## Phase 5 - STT
- provider abstraction
- real provider
- transcript chat bubble

Phase 5 implements a NestJS `TranscriptionModule` with an OpenAI-backed STT
provider selected only by backend configuration. Provider doubles are confined
to the test suite and are not selectable at runtime. Finalized
extension segments are uploaded as bounded multipart requests, displayed as a
temporary `Transcribing…` interviewer bubble, and replaced by the final
transcript. Raw audio is not persisted. Successful transcription publishes
`question.transcribed`; Phase 6 then invokes the answer flow.

## Phase 6 - Automatic answer
- final transcript -> agent -> LLM
- no manual Send

Phase 6 automatically invokes the classifier, bounded context builder, DevOps
prompt builder, provider abstraction, and validator once per finalized
transcript. SSE answer events carry stable question and assistant IDs. Segment
idempotency prevents a retried upload from creating a second answer. Failed
answers preserve their transcript and can be retried, while capture continues
to listen during concurrent answer streams. STT, first-token, and speech-end to
first-answer latency are logged.

The Phase 6 implementation also includes the provider-independent Interview
Answer Layer: conservative transcript normalization, a question gate, a
versioned mode-specific answer planner, and a quality gate. This improves
candidate-ready DevOps answers without enabling RAG, changing the extension
API, or adding another role.

Prompt version `devops-interview-answer-v4` calibrates answer depth to the
question: direct definitions stop after the definition and one essential
distinction, while applied modes retain theory-to-practice delivery and flag
purely theoretical responses without operational detail. A quality warning must
not hide an otherwise safe streamed answer from the candidate. Deterministic
evaluation fixtures cover the major interview question types without adding a
new roadmap phase.

## Phase 7 - Conversation context
- last 5-10 messages
- follow-up handling

Phase 7 is implemented with a bounded ten-message, completed-only context
snapshot for each question. It excludes the current and future turns, avoids an
orphaned leading assistant answer, and detects referential follow-ups that can
inherit the prior DevOps topic, level, and—only when appropriate—answer shape.
The follow-up relation is explicit in typed prompt input. No persistence, RAG,
candidate profile, or job-description context is introduced in this phase.

## Phase 8 - Persistence
- PostgreSQL
- history
- latency records

Phase 8 is implemented with versioned SQL migrations and a PostgreSQL-backed
repository. Interviews, ordered correlated messages, transcription metadata,
answer context snapshots, and STT/LLM latency records survive backend restarts.
Segment idempotency is checked against PostgreSQL in addition to the in-flight
request guard. Raw audio remains ephemeral and is never written to the
database. The readiness endpoint now verifies PostgreSQL connectivity.

This phase does not add authentication, rate limiting, public-network CORS
hardening, backups, or multi-instance SSE coordination; those remain Phase 9.

## Phase 9 - Production hardening
- auth
- rate limit
- strict CORS
- retries/timeouts
- logs/metrics

Phase 9 is implemented for the self-hosted V1 boundary. Creating a session
returns a 256-bit per-interview bearer token; only its SHA-256 hash is stored,
and every interview REST/SSE operation requires it. The extension keeps the
token in memory and uses authenticated fetch-based SSE so it never appears in a
URL. Redis provides fail-closed distributed rate limiting when enabled.

Production mode refuses to start without an exact CORS allowlist, enabled Redis
rate limiting, and protected Prometheus metrics. The backend adds security
headers, structured HTTP logs, explicit provider timeouts/retries, graceful
shutdown, PostgreSQL-aware readiness, and a non-root multi-stage image. Phase 9
does not replace platform TLS, a private database network, secret management,
scheduled backups/restore drills, or an identity-aware edge for a public
multi-user service.

## Phase 10 - DevOps knowledge RAG
- curated docs
- pgvector
- retrieval
- source/version metadata

Phase 10 is implemented with backend-only OpenAI embeddings behind an
`EmbeddingProvider` interface, pgvector, source-hashed Markdown ingestion, and
bounded similarity retrieval. Indexing is explicit (`npm run knowledge:index`)
so backend startup does not unexpectedly incur embedding cost. Only relevant
topic-matched chunks are injected into a prompt; missing or low-confidence
knowledge falls back to the LLM without claiming a source.

## Phase 11 - Candidate Profile + JD
- profile parser
- JD parser
- context injection
- no experience fabrication

Phase 11 is implemented as authenticated, per-interview context. The extension
uploads a PDF, TXT, or Markdown CV and optional JD after a session starts. The
backend stores bounded normalized text only, discards raw file bytes, and
injects profile/JD context independently into later prompts. The profile may
support an experience example only when it contains the relevant fact; the JD
prioritizes role requirements but cannot create an experience claim. Each
context may be replaced or removed from the authenticated Side Panel.

## Phase 12 - Feedback system
- good/bad
- preferred answer
- prompt/RAG improvement

## Phase 13 - Additional roles

Phase 13 begins with the supported `dba` role alongside `devops`. Interview
creation validates the selected role; the Side Panel locks its role selector
once a session starts. Classification, transcript glossary, prompt instructions,
RAG retrieval, and knowledge indexing are role-scoped. Migration 003 expands
the persisted role constraints. The first DBA taxonomy covers PostgreSQL,
MySQL, SQL Server, Oracle, backup/recovery, replication/HA, performance,
database security, and troubleshooting. Additional roles remain future work:

- backend
- frontend
- QA
- security
- data
