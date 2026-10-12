# Testing Strategy

## Unit tests

Backend:
- transcript normalizer and question gate
- classifier
- interview answer planner and quality gate
- prompt builder
- context builder
- answer validator
- deterministic provider test doubles kept outside production source
- interview state transitions
- CV/JD document extraction, validation, bounded prompt context, and no-
  fabrication prompt rules

Extension:
- state reducer/store
- chat rendering
- SSE append behavior
- capture lifecycle
- error state transitions

Phase 2 covers reducer behavior for separate interviewer/assistant bubbles, token append behavior, and visible connection errors. Capture lifecycle tests begin in Phase 3 because Phase 2 has no media capture.

Phase 3 capture tests verify that the active tab ID is used to obtain a Chrome media stream ID, diagnostics report the audio track/sample rate, and Stop or a tab-navigation interruption stops tracks and closes the AudioContext.

Phase 4 tests verify VAD state transitions: silence and short noise are ignored, sustained speech enters `speech_detected`, configured silence or the explicit Finish action enters `finalizing`, post-roll produces one ready segment, and finalization does not overlap a new utterance.

The manual interviewer-listening gate is tested separately: it starts closed,
accepts a segment only after an explicit **Listen** action, and closes again on
Pause/reset. Manual testing must also confirm that Pause stops local VAD/STT
processing without releasing the selected-tab capture stream.
They also verify that startup calibration learns a steady conferencing-tab noise
floor without learning an interviewer already speaking, and that a speech
candidate cannot raise the adaptive noise floor before the minimum-speech
duration has been established.
The audio-format suite also verifies that each utterance receives a complete
RIFF/WAVE header and correct PCM payload length, preventing the corrupted WebM
uploads found during real-provider smoke testing.

Phase 5 tests verify that a finalized segment first creates a transcribing
interviewer bubble and that a successful transcript replaces it. Backend
integration tests upload a multipart fixture through a test-only STT double,
verify the transcript message and `question.transcribed` path, reject a missing
or invalid upload with the structured error shape.

Phase 6 tests verify automatic transcript-to-answer SSE streaming, IDs on every
answer lifecycle event, idempotency for a repeated `segmentId`, stable ordering
for two active question/answer pairs, rejection of a token with mismatched
question correlation, and retrying a failed answer without removing its
transcript. They also verify that cancelling an incorrect final transcript
aborts only its correlated answer stream, removes that question/answer pair,
and leaves other interview turns intact.

Phase 7 tests verify the ten-message bound, removal of an orphaned leading
assistant answer, topic/level inheritance for follow-ups, preservation of a new
explicit follow-up answer shape, and an integration path where `Why?` correctly
uses the completed Kubernetes turn before it. Prompt tests verify that the
referenced interviewer question is identified separately from the current
question.

Phase 8 tests use an in-memory repository only as a unit/integration boundary
for deterministic business-logic tests. A separately enabled PostgreSQL test
applies the real schema and verifies ordered messages, correlations, transcript
metadata, latency/context records, and recovery through a new repository
instance. It is enabled with `RUN_DATABASE_TESTS=true` and a disposable
`DATABASE_URL`. Readiness tests verify the database check.

Phase 9 HTTP integration tests verify bearer-token enforcement and protected
metrics. The separately enabled Redis test verifies atomic counters and expiry
against the real Compose Redis service. Production dependency audit runs with
`npm audit --omit=dev`; development-only Jest tooling advisories do not ship in
the multi-stage runtime image.

Phase 10 tests verify heading-aware knowledge chunking, retrieval threshold and
topic-match fallback, and prompt grounding that never exposes retrieval or
source names to the candidate. The full knowledge index job is intentionally
not part of normal tests because it calls the configured embedding provider.

Phase 11 tests verify authenticated per-interview CV/JD upload, document type,
size, empty-text validation, metadata-only listing, text normalization, prompt
bounding, and that a profile is treated only as verified evidence rather than a
license to invent experience.

## Interview-answer quality evaluation

The test suite must assess answer quality, not only whether an LLM returned text.

For each deterministic text fixture, define:
- expected role, category, question type, level, and `responseMode`
- required answer points and allowed terminology
- prohibited unsupported personal claims
- required interview shape (for example comparison trade-offs or troubleshooting verification)
- expected keyword set or acceptable keyword alternatives

The initial evaluation set must cover at least:
- a definition, comparison, troubleshooting, scenario, architecture, and command question
- junior, middle, and senior calibration
- a behavioral question with verified candidate facts
- a behavioral question without candidate facts, which must produce an `Adaptable answer` rather than a fabricated first-person answer
- a follow-up question that depends on recent conversation context

Run deterministic classifier, prompt-builder, formatter, and validator tests on every change. Run the same evaluation set against the configured real provider before release, with human review for technical accuracy and interview usefulness.

The V1 answer-layer unit tests additionally verify that leading filler and
whitespace are normalized without changing technical terms, truly incomplete
questions use `clarification`, and the mode-specific plan is present in the
typed prompt input. Quality-gate tests cover generic assistant greetings and
Markdown list formatting as non-blocking presentation warnings so a usable
answer is not discarded after streaming, in addition to the hard safety and
length validator.

Transcription and classification tests cover English and Vietnamese DevOps and DBA
terms, selected-language prompts, controlled phonetic aliases, and Vietnamese
comparison wording. The original STT text must remain visible even when a
controlled interpretation is passed to answer orchestration.

The `devops-interview-answer-v3` deterministic evaluation suite covers
definition, comparison, troubleshooting, scenario, architecture, command, and
behavioral modes. Every generated prompt must include its calibrated answer
flow, and every deterministic fixture answer must pass the same runtime quality
gate. An applied technical answer with no configuration, command/check,
log/metric, rollout, trade-off, or verification detail receives a quality
warning for evaluation; direct definitions are intentionally exempt. An answer
is not hidden after streaming solely because of that warning.

## Integration tests

1. question -> test-only deterministic LLM double -> SSE
2. audio file -> test-only deterministic STT double -> transcript
3. final transcript -> classifier/context/prompt -> deterministic LLM double -> SSE
4. backend error -> extension recovery state
5. PostgreSQL write -> new repository instance -> restored interview history
6. Redis rate key -> atomic increments inside one expiring window

Phase 1 backend coverage must also verify:
- runtime provider selection contains no fake provider fallback
- deterministic test doubles stream without external credentials and are excluded from production builds
- SSE token events are emitted as multiple chunks and an unsubscribed client is released
- invalid request DTOs return the documented structured error shape
- `/health/live`, `/health/ready`, and the Swagger JSON document are served over HTTP

## End-to-end manual test

### Text path
Extension manual dev question
-> backend
-> streamed answer

For a real-provider smoke test, select `LLM_PROVIDER=openai`, configure a valid
backend-only `LLM_API_KEY` and `LLM_MODEL`, create a session, and use the
development-only manual question form. This consumes provider quota and may
incur cost, so keep the smoke test intentional and bounded. Do not use a live,
nondeterministic provider for automated quality assertions.

### Audio path
Open a browser tab containing a test interview recording.
Start capture.
Verify:
- audio is captured
- VAD creates one utterance
- transcript is correct
- a retryable transcription error offers retry
- a final transcript starts one streamed assistant answer automatically
- **Cancel** during speech detection discards local audio before STT; **Cancel
  question** after an incorrect transcript removes its transcript/answer pair
  and does not interrupt capture for the next question
- capture continues while an answer streams and a following utterance remains ordered
- a retryable answer error offers Retry answer without losing the transcript
- next utterance works

## Test fixtures

Maintain deterministic fixtures:
- Kubernetes definition question
- Terraform comparison question
- Infrastructure-as-Code definition and destructive-plan scenario
- Git shared-history/recovery question
- CrashLoopBackOff troubleshooting question
- AWS architecture scenario
- GCP monitoring/alerting scenario
- microservice dependency-timeout and duplicate-event scenarios
- DevSecOps supply-chain and secret-exposure scenarios
- noisy audio
- silence-only audio
- long question
- follow-up question
- behavioral question with and without a verified profile
- senior-level architecture scenario
- PostgreSQL PITR/replication incident and MySQL GTID failover question

## Production smoke test

After deployment:
- health endpoints pass
- create interview
- SSE connects
- STT provider responds
- LLM provider responds
- extension connects to production API
