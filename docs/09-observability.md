# Observability

## Core metrics

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

## Tracing

Optional initially.

Add distributed tracing if:
- multiple services
- provider latency troubleshooting becomes difficult
