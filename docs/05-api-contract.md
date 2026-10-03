# API Contract

Base:
`/api/v1`

Phase 1 stores sessions and messages in memory only. The endpoint contract is stable; PostgreSQL persistence is added in Phase 8.

## Health

GET `/health/live`

GET `/health/ready`

## Interviews

POST `/interviews`

Response:
```json
{
  "id": "uuid",
  "role": "devops",
  "status": "active",
  "createdAt": "ISO_DATE"
}
```

POST `/interviews/:id/end`

GET `/interviews/:id`

GET `/interviews/:id/messages`

## Manual development question

POST `/interviews/:id/questions`

Request:
```json
{
  "question": "What is Kubernetes HPA?"
}
```

Response:
```json
{
  "questionId": "uuid",
  "accepted": true
}
```

Phase 2 uses this endpoint only in development builds of the extension.

## Transcription

POST `/interviews/:id/transcriptions`

Content-Type:
`multipart/form-data`

Fields:
- `audio`: a non-empty supported audio file (`audio/webm`, `audio/ogg`,
  `audio/wav`, `audio/mpeg`, `audio/mp4`, or `audio/x-m4a`), maximum 10 MiB
- `durationMs`: integer from 1 to 31000
- `segmentId` (optional): client-generated UUID used to make retrying the same
  finalized segment idempotent
- `speechEndedAtMs` (optional): client-observed epoch milliseconds used only to
  calculate latency

MIME parameters emitted by browser recorders, for example
`audio/webm;codecs=opus`, are normalized to their base type before validation.
This does not broaden the supported base-type allowlist.

Response:
```json
{
  "messageId": "uuid",
  "questionId": "uuid",
  "text": "What is Kubernetes HPA?",
  "language": "en",
  "durationMs": 4200
}
```

The API discards raw audio after the provider call. On a successful final
transcription it adds an interviewer message, publishes `question.transcribed`,
and invokes the Interview Intelligence Layer once for that `questionId`.

POST `/interviews/:id/questions/:questionId/answer/retry`

Retries only a failed answer. It retains the same assistant `messageId` and
streams the retry over the existing SSE connection.

## SSE

GET `/interviews/:id/events`

Phase 2 connects to this endpoint after creating an interview and closes the browser EventSource when the session stops or the Side Panel unmounts.

Event types:

```text
session.ready
question.transcribing
question.transcribed
answer.started
answer.token
answer.keywords
answer.completed
answer.error
session.error
```

Example:

```text
event: question.transcribed
data: {"messageId":"q1","questionId":"q1","text":"What is Kubernetes HPA?","segmentId":"uuid"}

event: answer.started
data: {"messageId":"a1","questionId":"q1"}

event: answer.token
data: {"messageId":"a1","questionId":"q1","text":"Kubernetes "}

event: answer.completed
data: {"messageId":"a1","questionId":"q1","firstTokenMs":820,"totalMs":2150,"speechEndToFirstAnswerMs":1800}
```

`answer.error` also includes both IDs and `retryable`, allowing the Side Panel
to preserve the interviewer transcript and expose **Retry answer**.

For overlapping turns, clients must treat `{ messageId, questionId }` as the
answer-stream correlation key. A token with either value not matching the
existing assistant bubble must be ignored.

## Error shape

```json
{
  "code": "STT_TIMEOUT",
  "message": "Speech transcription timed out",
  "retryable": true,
  "requestId": "uuid"
}
```

Invalid request bodies use the same shape with `code: "REQUEST_INVALID"` and `retryable: false`.

Audio validation errors include `AUDIO_FILE_REQUIRED`, `AUDIO_TYPE_UNSUPPORTED`,
`AUDIO_FILE_EMPTY`, and `AUDIO_FILE_TOO_LARGE`. An invalid `durationMs` uses
the standard structured `REQUEST_INVALID` response.
