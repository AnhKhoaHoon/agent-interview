# DevOps response baseline

This benchmark evaluates only `devops`. It does not modify the runtime model,
prompt, RAG, VAD, or retry configuration. The 30 original fixtures in
`cases.mjs` include 15 Vietnamese and 15 English questions, rubric concepts,
reference answers, sources, two follow-ups, and a synthetic candidate profile.

## Specification and acceptance criteria

The specification is the user's baseline request: run each question three times
through text first, then through real browser-tab capture. Retain failures and
timeouts. Produce JSON, CSV and Markdown with answers, scores and verdicts.
No provider key, interview bearer token or audio bytes belong in these reports.

The implementation follows specification → plan → tasks → verification. It does
not claim that the Spec Kit CLI was installed or invoked in this repository.

- Text: 90 turn slots, serial, no warmup or automatic question retry.
- Audio: another 90 turn slots, only after the text phase is attempted.
- Maximum total: 180 turn submissions and 1,200 backend HTTP requests.
- Existing SDK retries and per-question embedding calls are included in a
  conservative provider-request ceiling captured from the running container.
  This is not an actual usage/billing measurement. With two retries per
  provider, the ceiling is 540 LLM + 270 STT + 540 embedding requests.
- Each paid slot is persisted before submission. Resume skips attempted rows;
  interrupted rows remain failures rather than being replayed for free.
- Audio target: median speech-end to first visible answer <3,000 ms, p95
  <6,000 ms and completion ≥98%. Missing/failed observations cannot pass.
- Quality target: reference-reviewed score ≥80/100, no critical technical or
  fabrication error. Lexical coverage alone never produces a quality pass.

## Run text first

Start the local Compose backend as documented in `docs/08-deployment.md`.
Commands below are run from the repository root with Node 22+ and Docker access.
Provider credentials remain inside the configured backend. The runner reads
only an allowlist of nonsecret runtime settings from the container.

```bash
node --test benchmarks/core.test.mjs
node benchmarks/run.mjs text --run-dir reports/my-baseline
```

Use the same run directory for the audio phase. A new directory creates a new
paid run. Do not delete `.lock` while a runner is active. Follow-up questions
reuse only their designated parent session; unrelated cases are isolated.

## Run real tab capture

On macOS, prepare short synthetic question recordings outside the repository:

```bash
node benchmarks/prepare-audio.mjs /tmp/agent-interview-benchmark-audio
cd extension
npm run build:benchmark
cd ..
node benchmarks/run.mjs audio --run-dir reports/my-baseline \
  --audio-dir /tmp/agent-interview-benchmark-audio \
  --extension-id YOUR_EXTENSION_ID
```

Synthetic fixtures use installed macOS `Linh`/`Samantha` voices. They are clean
speech and cannot establish accuracy on noisy meetings or human accents. Speech
end is an amplitude-based annotation of the WAV, not a human phonetic label.
For human recordings, supply the same 30 `devops-NN.wav` files and a
`manifest.json` keyed by case ID. Each entry needs `sha256`, `source`,
`durationMs` (≤30,000), and `speechEndOffsetMs` relative to that WAV.

1. Reload the unpacked extension from `extension/dist` in Chrome.
2. Open `http://localhost:4318` and the extension Side Panel.
3. Click **Join benchmark**. It adopts the runner's per-interview session in
   memory. No provider key is sent to Chrome.
4. Click **Audio**, select that player tab, enable **Share tab audio**, and
   click **Listen**. Authorization must be performed by the user.
5. Click **Start playback batch** on the player. Keep the Side Panel visible.
6. Let the batch finish. The coordinator permits at most one upload per turn.

The benchmark build alone adds the exact `http://localhost:4318/*` permission
and the Join controls. A normal `npm run build` removes them; reload Chrome to
use the newly built version. Do not rebuild/reload while an audio batch runs.
The coordinator listens only on loopback and releases the interview token only
to the exact extension origin passed with `--extension-id`.

## Measurements and interpretation

- `sttMs`: backend `stt.completed` service duration, including transcript handoff.
- `providerFirstTokenMs` / `providerTotalMs`: real LLM provider timing from logs.
- `answerPreparationMs`: RAG/context/prompt preparation, recorded separately.
- `requestToFirstTokenMs` / `requestToCompletedMs`: client API observation;
  audio uses upload start rather than playback start.
- `speechEndToFirstVisibleMs`: annotated playback speech end to a visible,
  foreground answer element after React commits and two animation frames.
  This approximates browser display; it is not physical display scanout timing.
- `speechEndToCompletedMs`: annotated speech end to the completion event.
- WER: accent/punctuation-normalized word edit distance. It is diagnostic and
  cannot alone establish whether technical meaning was preserved.

Reports retain all 180 planned rows. Percentiles use all available measurements,
including partial failed streams, and list missing counts. Failures remain in
completion and deadline-success denominators. Text timing cannot pass the audio
SLO. Small sample percentiles describe this run, not a production SLA.

`screening` is lexical rubric coverage, **not technical correctness**. Review
each answer against its reference and sources. Save `reviews.json` in the run
directory keyed by `trialId`, with `answerHash` (SHA-256), `score` (0–100),
`criticalError` (boolean), `method` (e.g. `human-reference-review`) and `notes`.
An agent review must be identified as such; do not label it a human review.

```bash
node benchmarks/run.mjs report --run-dir reports/my-baseline
```

An absent or stale review remains `needs_review`. Runtime errors fail even if
the partial answer looks correct. JSON/CSV/Markdown are written after each turn;
CSV neutralizes spreadsheet formula prefixes. Raw audio stays in the fixture
directory and is never copied into reports.

## Current evidence

`reports/devops-baseline-2026-11-19/` contains the first **text** baseline:
90 attempted, 88 completed, two quality-gate errors, no timeouts. Client first
token median 1,229.5 ms, p95 3,530 ms. These are not STT/audio/UI latency claims.
Audio rows are pending until actual capture evidence is recorded. Quality scores
are screening only until reference reviews are supplied. No baseline-driven
model or prompt optimization has been applied.

## Verification

Run backend and extension lint/tests/build as documented in `docs/10-testing.md`.
Also run the benchmark's offline tests. They verify fixture cardinality, budget
calculation, failure denominators, SSE framing, stale-review rejection and CSV
formula escaping. Real-provider and real-tab results are separate evidence.

```bash
backend/node_modules/.bin/eslint --config benchmarks/eslint.config.mjs benchmarks/
node --test benchmarks/core.test.mjs benchmarks/audio-server.test.mjs
```

The coordinator integration test opens an ephemeral loopback port and verifies
origin checks, token isolation, one-upload enforcement and question correlation.

The local `docker-compose.override.yml` removes Redis's host port to coexist
with other projects using 6379. Backend-to-Redis traffic still uses the Compose
network. Host-based Redis integration tests require an explicitly published
test port; do not accidentally run them against another project's Redis.
