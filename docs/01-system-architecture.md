# System Architecture

## High-level architecture

```text
+----------------------------+
| Interview Browser Tab      |
| Meet / Teams / Zoom Web    |
+-------------+--------------+
              |
              | user-authorized tab audio
              v
+----------------------------+
| Chrome Extension           |
| Manifest V3                |
|                            |
| Side Panel                 |
| Audio Capture              |
| VAD / Segmentation         |
| SSE Client                 |
+-------------+--------------+
              |
              | HTTPS REST + SSE
              v
+----------------------------+
| NestJS Backend             |
|                            |
| Interview Service          |
| Transcription Service      |
| Interview Intelligence     |
| SSE Stream Service         |
+------+-----------+---------+
       |           |
       |           |
       v           v
+-------------+ +-------------+
| STT Provider| | LLM Provider|
+-------------+ +-------------+
       |
       v
+----------------------------+
| PostgreSQL                 |
| Redis rate limit           |
| pgvector knowledge index   |
+----------------------------+
```

## Main runtime path

```text
Audio
-> VAD
-> Utterance
-> STT
-> Transcript
-> Question Classifier
-> Context Builder
-> Candidate Profile + Job Description context (when attached)
-> Knowledge Retrieval (when relevant)
-> Role Prompt Builder
-> LLM Stream
-> Answer Validator
-> SSE `answer.*`
-> Side Panel
```

Phase 6 starts exactly once for every finalized transcript. Question and answer
events carry stable `questionId` and `messageId` values, so a later interviewer
utterance can be transcribed while an earlier answer is still streaming without
mixing their bubbles or tokens.

Phase 7 builds an immutable context snapshot for each question from completed
messages that occurred before that question. It excludes the current question,
keeps at most ten recent messages, and never starts the bounded window with an
assistant answer whose interviewer turn has already been trimmed. This also
prevents a retried older answer from seeing later interview turns.

Phase 8 makes PostgreSQL the runtime source of truth. A repository boundary
keeps persistence out of classification and prompt logic. Interview creation,
message sequencing, transcript idempotency, answer context snapshots, and
latency completion are persisted before their corresponding completed state is
reported. Database row locking assigns stable message sequence numbers when
overlapping questions arrive. SSE subscriptions remain process-local.

## Overlapping interview events

V1 processes finalized turns concurrently; it does not pause capture or queue
Q2 behind a slow A1. Each finalized browser segment has a unique `segmentId`.
The backend creates one immutable interviewer `questionId` for its transcript
and one unique assistant `messageId` for the corresponding answer. Every
`answer.*` event includes both IDs.

```text
Q1 transcript -> q1 -> A1 stream (a1)
                         |
capture continues         +-> answer.token { messageId: a1, questionId: q1 }
                         |
Q2 transcript -> q2 -> A2 stream (a2)
                         +-> answer.token { messageId: a2, questionId: q2 }
```

The Side Panel inserts an assistant bubble next to its `questionId` and accepts
a token only when both its assistant `messageId` and `questionId` match. This
keeps the visible order as `Q1, A1, Q2, A2` while allowing A1 and A2 to stream
at the same time.

## Protocols

### REST

Use for:
- create/end interview
- settings
- history
- manual dev questions
- final audio segment upload
- per-interview profile/JD upload and context metadata

### SSE

Use for:
- question.transcribing
- question.transcribed
- answer.started
- answer.token
- answer.keywords
- answer.completed
- answer.error

### WebSocket

Use only if moving to:
- streaming audio chunks
- streaming STT
- partial transcript events

MVP production may use finalized utterance upload if latency meets target.

## Availability boundaries

Provider failures must not crash the session.

The extension should display:
- disconnected
- transcribing failed
- AI failed
- retry available
