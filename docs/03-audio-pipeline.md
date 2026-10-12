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

## Manual interviewer-listening window

A meeting tab can contain both the interviewer’s remote audio and audio played
while the candidate speaks. Therefore, connecting **Audio** does not arm
transcription by itself. The Side Panel starts in a closed, amber
**Paused — your turn** state.

Use this deliberate turn-taking flow:

1. Connect the selected interview tab with **Audio**.
2. Before the interviewer starts a question, select **Listen**. Only then do
   VAD and STT accept a segment.
3. When the interviewer finishes, either wait for the silence timeout or select
   **Finish** to finalize the question immediately.
4. Once finalization has returned to listening, select **Pause** before giving
   your answer. The selected tab remains connected, but VAD, PCM processing,
   and transcription are stopped locally.
5. Select **Listen** again for the next interviewer turn.

Selecting **Pause** while an utterance is still detected intentionally discards
that unfinished local audio. Select **Finish** first when the question should
be transcribed. A segment is uploaded only if it finalizes while the listening
window is open; otherwise it is discarded in the extension and never reaches
the backend.

Initial configuration:

- minimum speech duration: 300 ms
- silence timeout: 1,000 ms
- max utterance: 30 s
- startup noise calibration: 650 ms
- pre-roll buffer: 900 ms
- post-roll buffer: 300 ms

All values should be configurable.

Phase 4 detects voice from RMS samples of the captured tab audio. At capture start,
it samples the conferencing tab's low-level audio bed for 650 ms and derives a
noise floor before opening an utterance. The buffered 900 ms pre-roll protects a
question that begins during this brief calibration. If the startup window has
speech-like dynamics, the pipeline retains its conservative floor instead of
learning the speaker as background noise. It begins an utterance only after
minimum speech, finalizes after the silence timeout plus post-roll, and prevents
another segment from starting until the finalization flush completes. The
one-second timeout prioritizes a responsive interview handoff; **Finish** remains
available when an explicit end-of-question signal is preferable.

When **Speech detected** is visible, the Side Panel also exposes **Finish**. Use it only after the interviewer has completed the question: it finalizes the current utterance (including post-roll) immediately, sends it through STT, and keeps tab capture running for the next question. This gives the user an explicit end-of-question signal when a faster response is wanted. **Cancel** discards the current local utterance before it is uploaded; it is available while speech is detected and during the brief post-roll finalization window, then VAD returns to listening. If STT has already returned an incorrect visible transcript, use **Cancel question** in that chat bubble; it cancels the correlated answer stream and removes the pair while capture continues. VAD still provides the automatic fallback, because no detector can reliably distinguish a long thinking pause from the true end of speech without a user signal.

The Side Panel shows a compact live **Sound** meter from the selected tab. An
empty meter means Chrome is delivering no tab audio; re-open the picker, select
the interview tab, and enable **Share tab audio** before diagnosing STT. The
speech threshold adapts to the tab's observed noise floor while retaining a
small minimum threshold so quiet remote speech can still start an utterance.
Startup calibration prevents a persistent Meet audio bed from being held as
speech until the maximum-utterance limit. After that window, only samples below
the current speech threshold update the noise floor. This prevents a quiet
interviewer’s first words from being learned as background noise before the
minimum-speech window is reached.

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

Before the provider call, backend orchestration attaches a role-specific STT
vocabulary prompt in the selected language. With the quality-first
`gpt-transcribe` model it also sends the same controlled vocabulary as provider
keyword guidance. This improves transcription of English technical terms in
either interview language, such as `Docker`, `Kubernetes`, `Terraform`,
`Jenkins`, and `Argo CD`; it is guidance, not a replacement for audible speech.
The glossary contains DevOps terms for a DevOps session and database terms such
as `PostgreSQL`, `WAL`, `PITR`, `GTID`, and `RMAN` for a DBA session. For this
model the provider adapter sends only `languages: [vi|en]`, never the
legacy singular `language` field, because OpenAI rejects a request containing
both fields.
It is backend-owned context only; the extension cannot set it and no raw audio
is retained after the request. The chat always shows the provider's original
transcript. If a narrowly scoped DevOps spelling correction is used for answer
orchestration, it is displayed separately as the interpretation used to answer.

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
