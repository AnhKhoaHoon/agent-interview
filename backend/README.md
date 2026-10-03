# Backend

NestJS API for the DevOps interview text path and Phase 5 finalized-segment
transcription.

## Local run

From the repository root:

```bash
cp .env.example .env
docker compose up --build
```

The API is available at `http://localhost:3000/api/v1`; Swagger is at `http://localhost:3000/api/docs`.

The default runtime path uses `LLM_PROVIDER=openai`; set `LLM_API_KEY` and
`LLM_MODEL` in the uncommitted root `.env` file. The mock provider remains
available only for deterministic automated tests or an explicitly selected
offline development run.

The default runtime path uses the backend-only OpenAI STT implementation; set
`STT_PROVIDER=openai`, `STT_API_KEY`, and `STT_MODEL`. The mock STT provider is
reserved for deterministic automated tests or explicit offline development. Raw audio is
processed only for the request and is not persisted; Phase 5 publishes the
transcript and Phase 6 automatically streams one correlated LLM answer. Failed
answers can be retried through the interview API without re-uploading audio.

Before generation, the backend conservatively normalizes the transcript,
classifies and gates the question, then produces a provider-independent,
versioned DevOps answer plan. The LLM receives the plan with bounded context;
the quality gate rejects invalid answers before completion while preserving the
transcript and retry path.

Conversation context is bounded to the ten most recent completed messages that
precede each question. Follow-up questions can reuse the previous DevOps topic
and level, while retries use the original point-in-conversation snapshot rather
than later turns.

The versioned `devops-interview-answer-v2` plan drives each technical response
from principle to practical operation and verification. The runtime quality
gate rejects an answer that remains purely theoretical, and deterministic
fixtures cover the major DevOps interview question shapes.

## Checks

```bash
cd backend
npm ci
npm run lint
npm test
npm run build
```
