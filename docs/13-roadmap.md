# Production Roadmap

## Documentation discipline

Every implementation change must update the applicable documentation in the same change set. In particular, keep product scope, architecture, API contracts, environment variables, Docker Compose/local runtime, testing instructions, runbook, and release checklist aligned with the code.

Do not mark a roadmap phase complete until its code and affected documentation have both been updated and verified.

## Phase 1 - Core backend
- NestJS
- Swagger
- mock LLM
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

Phase 5 implements a NestJS `TranscriptionModule` with a mock provider and an
OpenAI-backed STT provider selected only by backend configuration. Finalized
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

Prompt version `devops-interview-answer-v2` adds a mode-specific
theory-to-practice delivery flow and rejects purely theoretical technical
answers that contain no operational detail. Deterministic evaluation fixtures
cover the major interview question types without adding a new roadmap phase.

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

## Phase 9 - Production hardening
- auth
- rate limit
- strict CORS
- retries/timeouts
- logs/metrics
- backups

## Phase 10 - DevOps knowledge RAG
- curated docs
- pgvector
- retrieval
- source/version metadata

Curated DevOps source cards may be maintained under `knowledge/devops/` before
this phase. Adding or editing those cards does not enable RAG, indexing, or
automatic prompt injection; those runtime capabilities remain Phase 10 work.

## Phase 11 - Candidate Profile + JD
- profile parser
- JD parser
- context injection
- no experience fabrication

## Phase 12 - Feedback system
- good/bad
- preferred answer
- prompt/RAG improvement

## Phase 13 - Additional roles
- backend
- frontend
- QA
- security
- data
