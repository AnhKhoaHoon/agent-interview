# API Contract

Base:
`/api/v1`

Phase 8 stores sessions, messages, transcription metadata, answer context, and
latency records in PostgreSQL. Existing endpoint shapes remain stable.

Except for health, metrics, Swagger when enabled, and interview creation, every
endpoint containing `:id` requires `Authorization: Bearer <accessToken>`. The
token is returned once at creation and is never accepted in a query string.

## Health

GET `/health/live`

GET `/health/ready`

Readiness returns HTTP 200 only when the application can query PostgreSQL:

```json
{"status":"ok","checks":{"application":"ok","database":"ok"}}
```

## Interviews

POST `/interviews`

Response:
```json
{
  "id": "uuid",
  "role": "devops",
  "status": "active",
  "createdAt": "ISO_DATE",
  "accessToken": "43-character-base64url-token"
}
```

The backend stores only the SHA-256 token hash. Later interview responses do
not echo the token.

POST `/interviews/:id/end`

GET `/interviews/:id`

GET `/interviews/:id/messages`

## Manual development question

POST `/interviews/:id/questions`

Request:
```json
{
  "question": "What is Kubernetes HPA?",
  "language": "en"
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
`language` is `vi` or `en` and forces the streamed answer language for that
question. The audio transcription endpoint applies the same rule using its
per-segment language field.

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
- `language` (optional): `vi` or `en`; a per-segment transcription hint. V1
  supports Vietnamese and English only; omitted values default to backend `en`.

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

`understoodText` is optional and appears only when a controlled technical-term
interpretation differs from the original `text`; `text` always remains the
provider transcript. The API discards raw audio after the provider call. On a
successful final transcription it adds an interviewer message, publishes
`question.transcribed`, and invokes the Interview Intelligence Layer once for
that `questionId`.

POST `/interviews/:id/questions/:questionId/answer/retry`

Retries only a failed answer. It retains the same assistant `messageId` and
streams the retry over the existing SSE connection.

POST `/interviews/:id/questions/:questionId/cancel`

Discards a recognized but incorrect interviewer transcript. The backend aborts
its active LLM stream where supported, deletes that interviewer message and its
correlated assistant message/transcription metadata, then publishes
`question.cancelled`. This endpoint is scoped to the interview bearer token
and affects only the supplied `questionId`; overlapping turns continue.

Response:

```json
{
  "questionId": "uuid",
  "cancelled": true
}
```

## Candidate profile and job description

GET `/interviews/:id/context`

Returns metadata only, never the stored CV/JD text:

```json
[
  {
    "kind": "profile",
    "sourceFilename": "candidate-cv.pdf",
    "characterCount": 4210,
    "updatedAt": "ISO_DATE"
  }
]
```

POST `/interviews/:id/context/profile`

POST `/interviews/:id/context/job-description`

DELETE `/interviews/:id/context/profile`

DELETE `/interviews/:id/context/job-description`

Both endpoints require the per-interview bearer token and accept
`multipart/form-data` with one `document` field. Supported types are
`application/pdf`, `text/plain`, and `text/markdown`; the default maximum size
is 2 MiB. The backend extracts and normalizes readable text, persists that text
per interview, and discards the raw file bytes. It does not call an AI provider
while uploading. A later answer receives bounded profile/JD context only.
`DELETE` removes the normalized stored text for that context and returns
`{ "removed": true }`; it is safe to call again and then returns `false`.

Document errors use the standard error shape with one of
`CANDIDATE_DOCUMENT_REQUIRED`, `CANDIDATE_DOCUMENT_EMPTY`,
`CANDIDATE_DOCUMENT_TYPE_UNSUPPORTED`, `CANDIDATE_DOCUMENT_TOO_LARGE`,
`CANDIDATE_DOCUMENT_UNREADABLE`, or `CANDIDATE_CONTEXT_KIND_INVALID`.

## SSE

GET `/interviews/:id/events`

The extension opens this endpoint with authenticated `fetch`, parses the SSE
frames incrementally, retries interrupted streams, and aborts the request when
the session stops or the Side Panel unmounts. Native `EventSource` is not used
because it cannot attach the required bearer header.

## Metrics

GET `/metrics`

Prometheus output is available only when `METRICS_ENABLED=true` and the request
uses the backend-only `METRICS_BEARER_TOKEN`. An invalid or disabled scrape
returns the structured `METRICS_UNAUTHORIZED` response. This credential never
belongs in the extension.

Event types:

```text
session.ready
question.transcribing
question.transcribed
question.cancelled
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
data: {"messageId":"q1","questionId":"q1","text":"Zen tin la gi?","understoodText":"Jenkins la gi?","segmentId":"uuid"}

event: answer.started
data: {"messageId":"a1","questionId":"q1"}

event: answer.token
data: {"messageId":"a1","questionId":"q1","text":"Kubernetes "}

event: answer.completed
data: {"messageId":"a1","questionId":"q1","firstTokenMs":820,"totalMs":2150,"speechEndToFirstAnswerMs":1800}
```

`answer.error` also includes both IDs and `retryable`, allowing the Side Panel
to preserve the interviewer transcript and expose **Retry answer**.

The Side Panel provides two distinct cancellation points: **Cancel** during
speech detection discards local audio before STT upload; **Cancel question** on
a final transcript calls the endpoint above, removes that question/answer pair,
and ignores any late correlated SSE token.

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

Provider-facing transcription failures remain structured without exposing a
provider response body: `STT_EMPTY_RESULT`, `STT_CREDENTIALS_REJECTED`,
`STT_RATE_LIMITED`, `STT_AUDIO_REJECTED`, or `STT_TRANSCRIPTION_FAILED`.
