# Operations Runbook

## Backend is live but not ready

Check:

1. PostgreSQL container/service health and DNS reachability
2. `DATABASE_URL` host, database, user, password, and TLS settings
3. connection-pool exhaustion and PostgreSQL connection limits
4. whether `npm run db:migrate` completed successfully
5. `schema_migrations` contains every reviewed migration file

Do not route traffic based only on `/health/live`; `/health/ready` includes the
mandatory database dependency.

## Database migration fails

Keep the previous backend release serving traffic, inspect the failed migration
and PostgreSQL logs, and correct it with a new reviewed migration. Do not edit a
migration already applied to a shared environment. The runner uses a PostgreSQL
advisory lock so only one instance applies pending files at a time.

## Requests return 401

Check that the request uses the `accessToken` returned by the same interview
creation response. The token must be sent as an Authorization bearer header,
not a query parameter. It is intentionally lost when the Side Panel/session is
closed and cannot be recovered from PostgreSQL because only its hash is stored.

## Requests return 429 or rate-limit unavailable

Check Redis readiness, `RATE_LIMIT_*` values, proxy/IP configuration, and the
`Retry-After` response. Production fails closed when Redis cannot enforce the
limit. Do not disable the guard to work around an outage; restore Redis or route
to a healthy dependency.

## Backup and restore

Schedule `scripts/backup-postgres.sh` with explicit `DATABASE_URL` and
`BACKUP_DIR`, encrypt and retain its custom-format dump according to policy, and
alert on failures. Test `scripts/restore-postgres.sh` in an isolated database;
it requires an existing `BACKUP_FILE` and the explicit destructive confirmation
`CONFIRM_RESTORE=yes`. Never perform the first restore drill against production.
The backup script validates the dump catalog and writes a SHA-256 checksum;
restore refuses a dump whose checksum file is missing or invalid.

## Extension cannot connect

Check:
1. backend health
2. HTTPS certificate
3. CORS allowlist
4. production API URL
5. extension ID
6. browser console

## Tab capture fails

Check:
1. user granted capture
2. selected tab actually has audio
3. capture track is live
4. browser version supports required API
5. stream tracks were not stopped

## No transcript

Check:
1. segment contains speech
2. Chrome picker selected the interview tab and **Share tab audio** was enabled
3. capture diagnostics report a live audio track
4. the rebuilt extension is loaded; it sends PCM WAV, not the legacy WebM recorder output
5. STT credentials, quota, and request size
6. STT provider response and language behavior

The Side Panel reports `STT_EMPTY_RESULT` as “No speech was recognized”; this
usually means the selected tab was not sharing audio or the utterance was too
short. `STT_CREDENTIALS_REJECTED` requires correcting the backend-only
`STT_API_KEY`; it is not an extension setting. `STT_RATE_LIMITED` is retryable.
The Side Panel language selector is sent with each segment and takes precedence
over `STT_LANGUAGE`. The backend fallback is `en`; use `STT_LANGUAGE=vi` only
for clients that omit the language hint and should default to Vietnamese. V1
intentionally supports only these two languages. Restart the backend after
changing this fallback setting.

If common role-specific names are transcribed phonetically (for example `Docker` as a
Vietnamese-sounding word), confirm the Side Panel mode matches the spoken
sentence. The backend sends a selected-language glossary matching the session role to STT to
preserve technical spellings; it does not correct arbitrary words that were not
audible in the captured tab audio.

## Transcript exists but no AI answer

Check:
1. interview session active
2. agent orchestration logs
3. LLM credentials
4. rate limit/quota
5. SSE connection
6. prompt validation

If `answer.error` is retryable, use **Retry answer** from the matching
assistant bubble. Do not re-upload audio: the interviewer transcript and its
question ID are already preserved.

## CV or JD upload fails

Use a text-based PDF, TXT, or Markdown file under the configured 2 MiB default.
A scanned/image-only PDF has no extractable text and returns
`CANDIDATE_DOCUMENT_UNREADABLE`; export it as a text-based PDF or TXT instead.
The upload needs the active session's bearer token, so start a new session
before attaching context. The API intentionally lists metadata only; it does
not return stored CV/JD text to the extension.

Use **Remove** in Profile context (or the authenticated `DELETE` context API)
to delete the normalized CV or JD text from that interview. Replacing a document
also replaces its previous extracted text; raw upload bytes are never retained.

## SSE disconnects

Check:
1. reverse proxy buffering
2. read timeout
3. connection/network stability
4. backend stream cleanup
5. browser console

## High latency

Measure separately:
- VAD wait time
- upload time
- STT time
- classifier/context time
- LLM first-token time
- speech-end to first-answer time

Optimize the dominant component rather than guessing.

## Provider outage

Desired behavior:
- show retryable error
- keep session alive
- allow retry of last transcription/answer
- do not lose chat history
