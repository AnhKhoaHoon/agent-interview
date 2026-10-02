# Operations Runbook

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
2. supported audio format
3. STT credentials
4. request size
5. STT provider response
6. language configuration

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
