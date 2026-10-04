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
- silence timeout: 2,000 ms
- max utterance: 30 s
- pre-roll buffer: 250 ms
- post-roll buffer: 300 ms

All values should be configurable.

Phase 4 detects voice from RMS samples of the captured tab audio. It begins an utterance only after minimum speech, retains pre-roll to avoid cutting its beginning, finalizes after the silence timeout plus post-roll, and prevents another segment from starting until the finalization flush completes. The two-second timeout deliberately favors a complete interview question when the interviewer pauses naturally.

When **Speech detected** is visible, the Side Panel also exposes **Finish**. Use it only after the interviewer has completed the question: it finalizes the current utterance (including post-roll) immediately, sends it through STT, and keeps tab capture running for the next question. This gives the user an explicit end-of-question signal when a faster response is wanted. VAD still provides the automatic fallback, because no detector can reliably distinguish a long thinking pause from the true end of speech without a user signal.

The Side Panel shows a compact live **Sound** meter from the selected tab. An
empty meter means Chrome is delivering no tab audio; re-open the picker, select
the interview tab, and enable **Share tab audio** before diagnosing STT. The
speech threshold adapts to the tab's observed noise floor while retaining a
small minimum threshold so quiet remote speech can still start an utterance.

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

Phase 5 uploads each finalized in-memory mono PCM `audio/wav` Blob with
`durationMs` and the selected `vi` or `en` language hint to the backend. A
packaged, local `AudioWorklet` supplies mono PCM
frames; they are retained only for the configured
VAD window and encoded as a self-contained WAV file per utterance. This avoids
uploading dependent `MediaRecorder` WebM chunks that lack container headers and
are rejected by real STT providers as corrupted audio. The backend validates
MIME type, non-empty content, a 10 MiB
maximum upload, and a 31-second maximum duration before it calls STT. It keeps
the raw bytes only for the request/provider call and never persists them. A
successful result becomes an interviewer transcript and publishes
`question.transcribed`.

Before the provider call, backend orchestration attaches a V1 DevOps STT
vocabulary prompt in the selected language. This improves transcription of
English technical terms embedded in Vietnamese questions, such as `Docker`,
`Kubernetes`, `Terraform`, and `Argo CD`. It is backend-owned context only;
the extension cannot set it and no raw audio is retained after the request.

The backend independently strips MIME parameters before applying its allowlist.
Unsupported base types remain rejected. Captured tab audio is also routed back
to the local AudioContext destination so selecting tab capture does not silence
the interview for the user.

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
