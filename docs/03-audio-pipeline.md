# Audio Pipeline

## Recommended V1 production flow

```text
Selected tab audio
-> Web Audio API
-> VAD
-> one utterance segment
-> encode supported audio format
-> upload to backend
-> STT
-> final transcript
```

This is simpler and more reliable than starting with full streaming STT.

## Phase 3 boundary

Phase 3 implements only explicit selected-tab capture and local lifecycle diagnostics. The captured MediaStream is not encoded, segmented, saved, uploaded, or sent to an STT provider until later roadmap phases.

## VAD

VAD and segment timing lives in one configuration module in the extension (`audio/vad-config.ts`); it must not be duplicated across UI or audio code.

Initial configuration:

- minimum speech duration: 300 ms
- silence timeout: 900 ms
- max utterance: 30 s
- pre-roll buffer: 250 ms
- post-roll buffer: 300 ms

All values should be configurable.

Phase 4 detects voice from RMS samples of the captured tab audio. It begins an utterance only after minimum speech, retains pre-roll to avoid cutting its beginning, finalizes after the silence timeout plus post-roll, and prevents another segment from starting until the finalization flush completes.

## Segment rules

Reject or ignore:
- empty audio
- very short noise-only segments
- segments over configured max size
- unsupported audio types

Silence-only and speech-shorter-than-minimum segments are ignored. Development logs may contain a finalized segment's duration only, never raw samples, Blob data, or transcribed contents.

## Audio format

Pick one format supported reliably by both browser capture and STT provider.

Normalize where necessary:
- mono
- supported sample rate
- bounded file size

## Raw audio retention

Default:

```text
capture -> STT -> discard
```

Do not store interview audio unless explicitly enabled.

## Phase 5 upload boundary

Phase 5 uploads each finalized in-memory `audio/webm` Blob with `durationMs`
to the backend. The backend validates MIME type, non-empty content, a 10 MiB
maximum upload, and a 31-second maximum duration before it calls STT. It keeps
the raw bytes only for the request/provider call and never persists them. A
successful result becomes an interviewer transcript and publishes
`question.transcribed`.

Chrome may report the recorder format as `audio/webm;codecs=opus`. The extension
normalizes this to the container MIME type `audio/webm` before upload, and the
backend independently strips MIME parameters before applying its allowlist.
Unsupported base types remain rejected.

## Phase 6 answer handoff

The finalized segment carries a client-generated `segmentId` for idempotency
and a speech-end timestamp for latency measurement. The backend reuses the
first result for repeated uploads of that segment, then invokes the Interview
Intelligence Layer once for the resulting question ID. It emits a correlated
assistant stream while capture immediately resumes listening for the next
utterance.

## Later optimization

If finalized-segment latency is too high, move to:

```text
audio chunks
-> WebSocket
-> streaming STT
-> partial transcript
-> final transcript
```

Do not implement this complexity until measured latency justifies it.
