# Testing Strategy

## Unit tests

Backend:
- transcript normalizer and question gate
- classifier
- interview answer planner and quality gate
- prompt builder
- context builder
- answer validator
- mock providers
- interview state transitions

Extension:
- state reducer/store
- chat rendering
- SSE append behavior
- capture lifecycle
- error state transitions

Phase 2 covers reducer behavior for separate interviewer/assistant bubbles, token append behavior, and visible connection errors. Capture lifecycle tests begin in Phase 3 because Phase 2 has no media capture.

Phase 3 capture tests verify that the active tab ID is used to obtain a Chrome media stream ID, diagnostics report the audio track/sample rate, and Stop or a tab-navigation interruption stops tracks and closes the AudioContext.

Phase 4 tests verify VAD state transitions: silence and short noise are ignored, sustained speech enters `speech_detected`, configured silence enters `finalizing`, post-roll produces one ready segment, and finalization does not overlap a new utterance.

Phase 5 tests verify that a finalized segment first creates a transcribing
interviewer bubble and that a successful transcript replaces it. Backend
integration tests upload a multipart fixture through the mock STT provider,
verify the transcript message and `question.transcribed` path, reject a missing
or invalid upload with the structured error shape.

Phase 6 tests verify automatic transcript-to-answer SSE streaming, IDs on every
answer lifecycle event, idempotency for a repeated `segmentId`, stable ordering
for two active question/answer pairs, rejection of a token with mismatched
question correlation, and retrying a failed answer without removing its
transcript.

Phase 7 tests verify the ten-message bound, removal of an orphaned leading
assistant answer, topic/level inheritance for follow-ups, preservation of a new
explicit follow-up answer shape, and an integration path where `Why?` correctly
uses the completed Kubernetes turn before it. Prompt tests verify that the
referenced interviewer question is identified separately from the current
question.

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
typed prompt input. Quality-gate tests cover generic assistant greetings in
addition to the hard safety and length validator.

The `devops-interview-answer-v2` deterministic evaluation suite covers
definition, comparison, troubleshooting, scenario, architecture, command, and
behavioral modes. Every generated prompt must include its theory-to-practice
delivery flow, and every mock answer must pass the same runtime quality gate.
Technical fixtures fail when they contain only theory and no configuration,
command/check, log/metric, rollout, trade-off, or verification detail.

## Integration tests

1. question -> mock LLM -> SSE
2. audio file -> mock STT -> transcript
3. final transcript -> classifier/context/prompt -> mock LLM -> SSE
4. backend error -> extension recovery state

Phase 1 backend coverage must also verify:
- mock LLM streams without `LLM_API_KEY`
- SSE token events are emitted as multiple chunks and an unsubscribed client is released
- invalid request DTOs return the documented structured error shape
- `/health/live`, `/health/ready`, and the Swagger JSON document are served over HTTP

## End-to-end manual test

### Text path
Extension manual dev question
-> backend
-> streamed answer

### Audio path
Open a browser tab containing a test interview recording.
Start capture.
Verify:
- audio is captured
- VAD creates one utterance
- transcript is correct
- a retryable transcription error offers retry
- a final transcript starts one streamed assistant answer automatically
- capture continues while an answer streams and a following utterance remains ordered
- a retryable answer error offers Retry answer without losing the transcript
- next utterance works

## Test fixtures

Maintain deterministic fixtures:
- Kubernetes definition question
- Terraform comparison question
- CrashLoopBackOff troubleshooting question
- AWS architecture scenario
- noisy audio
- silence-only audio
- long question
- follow-up question
- behavioral question with and without a verified profile
- senior-level architecture scenario

## Production smoke test

After deployment:
- health endpoints pass
- create interview
- SSE connects
- STT provider responds
- LLM provider responds
- extension connects to production API
