# Observability

## Core metrics

The protected `/api/v1/metrics` endpoint exports Prometheus process/runtime
metrics plus HTTP request counts and latency histograms. Route labels use route
templates rather than interview UUIDs to avoid unbounded cardinality. Configure
the scraper with `METRICS_BEARER_TOKEN`; never expose that credential to the
extension.

### Product latency
- audio_segment_duration_ms
- stt_latency_ms
- question_to_ai_start_ms
- llm_first_token_ms
- llm_total_ms
- speech_end_to_first_answer_ms

### Reliability
- stt_success_total
- stt_failure_total
- llm_success_total
- llm_failure_total
- sse_disconnect_total
- capture_error_total

### Usage
- interview_sessions_total
- questions_total
- avg_questions_per_session

## Target SLOs for V1

Initial targets, subject to provider latency:

- API availability: 99.5%
- successful transcription: >= 98%
- successful answer generation: >= 98%
- median speech-end to first answer token: < 3s
- p95 speech-end to first answer token: < 6s

## Logs

Structured JSON preferred.

Include:
- timestamp
- level
- requestId
- interviewId
- event
- durationMs
- provider
- errorCode

Phase 6 emits structured `stt.completed`, `llm.first_token`, `answer.completed`,
and failure events. They include the interview/question/assistant IDs where
applicable, STT latency, LLM first-token latency, and speech-end-to-first-answer
latency. The browser also reports the latter from its local clock in development
diagnostics; cross-machine production measurements should account for clock skew.

The Interview Answer Layer emits `answer.plan` before provider invocation. It
contains IDs, answer decision, category, response mode, level, and prompt
version, but never transcript text, audio, provider credentials, or prompt
contents.

Phase 7 adds the boolean `isFollowUp` field to `answer.plan`, allowing follow-up
behavior to be measured without logging interview text.

Phase 8 persists `transcriptions.latency_ms`,
`ai_responses.first_token_ms`, `ai_responses.total_latency_ms`, and
`ai_responses.speech_end_to_first_answer_ms`. Structured logs remain the source
for request-level failures; PostgreSQL records support historical latency
analysis without retaining raw audio.

Phase 9 adds `http.request_completed` structured events with request ID,
method, path, status, and duration. Authorization headers, bearer tokens,
provider keys, prompts, transcripts, and audio contents are excluded.

Phase 10 emits `rag.index.completed` with document/chunk totals and
`rag.retrieved` with only the selected category, chunk count, and similarity
range. `rag.fallback` records a safe reason such as `disabled`, `no_match`, or
`provider_unavailable`. None of these events contains a question, Markdown
chunk, embedding, prompt, transcript, or credential. This makes relevance and
index health observable without turning interview content into logs.

Phase 11 emits `candidate_context.updated` and `candidate_context.removed` with
only the interview ID, context kind, and character count where applicable. PDF
parse failures record an error name only. CV/JD text, raw bytes, filenames, and
prompt content are excluded from logs.

### STT diagnostics

The transcription path emits structured `stt.upload.received`,
`stt.upload.rejected`, `stt.upload.deduplicated`, `stt.provider.started`,
`stt.completed`, and `stt.failed` events. The OpenAI adapter additionally
emits request start, completion, and failure events with a provider status/code
when available. These events correlate through `requestId` and include only
audio metadata (MIME type, byte size, duration, and transcript character
count); they must never include audio bytes, transcript text, request headers,
or provider credentials. Failed HTTP requests are emitted as
`http.request_failed` with the same `requestId`.

## Tracing

Optional initially.

Add distributed tracing if:
- multiple services
- provider latency troubleshooting becomes difficult
