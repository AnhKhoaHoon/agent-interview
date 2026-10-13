# Backend

NestJS API for the DevOps interview text path and Phase 5 finalized-segment
transcription.

## Local run

From the repository root:

```bash
cp .env.example .env
docker compose up --build
```

For the exact `.env` profiles, health verification, Chrome Extension CORS
setup, and production limitations, follow
[the deployment and operation guide](../docs/08-deployment.md).

The API is available at `http://localhost:3000/api/v1`; Swagger is at `http://localhost:3000/api/docs`.

The default runtime path uses `LLM_PROVIDER=openai`; set `LLM_API_KEY` and
`LLM_MODEL` in the uncommitted root `.env` file. OpenAI is the only runtime LLM
provider. Deterministic doubles exist only inside the test suite and are
excluded from the production build.

The default runtime path uses the backend-only OpenAI STT implementation; set
`STT_PROVIDER=openai`, `STT_API_KEY`, and `STT_MODEL`. Set optional
`STT_LANGUAGE=en` is the English fallback; use `vi` for Vietnamese-only clients
that omit the per-segment language hint. The V1 runtime accepts
only these two interview languages and has no fake
STT fallback; deterministic transcription doubles exist only in tests. Raw audio is
processed only for the request and is not persisted; Phase 5 publishes the
transcript and Phase 6 automatically streams one correlated LLM answer. Failed
answers can be retried through the interview API without re-uploading audio.

For each selected language, backend orchestration supplies a DevOps vocabulary
prompt to STT (for example `Docker`, `Kubernetes`, `Terraform`, and `Argo CD`).
It improves spelling of English technical terms mixed into Vietnamese questions;
it does not send a provider key or any prompt from the extension.

Before generation, the backend conservatively normalizes the transcript,
classifies and gates the question, then produces a provider-independent,
versioned DevOps answer plan. The LLM receives the plan with bounded context;
the quality gate rejects invalid answers before completion while preserving the
transcript and retry path.

Conversation context is bounded to the ten most recent completed messages that
precede each question. Follow-up questions can reuse the previous DevOps topic
and level, while retries use the original point-in-conversation snapshot rather
than later turns.

## Phase 10 DevOps knowledge RAG

The backend retrieves curated `knowledge/devops/` sections from pgvector only
when they clear the configured similarity threshold and match the classified
topic. Otherwise it falls back to normal LLM knowledge without claiming a
source. Build the Compose image, then index changed knowledge explicitly:

```bash
docker compose exec backend npm run knowledge:index
```

`EMBEDDING_API_KEY` is backend-only and may be omitted when `LLM_API_KEY` has
embedding access. Never put it in the extension. Indexing makes embedding API
requests and is therefore not performed automatically on startup.

Phase 8 persists interviews, ordered messages, transcript metadata, immutable
answer context snapshots, and latency fields in PostgreSQL. The container runs
`npm run db:migrate` before startup, and `/health/ready` checks database
connectivity. Uploaded raw audio is still never stored.

Phase 9 returns a random access token when an interview is created and requires
it as a bearer header on every interview-specific REST/SSE request. Only the
hash is stored. Production mode additionally requires strict CORS, Redis rate
limiting, and protected Prometheus metrics. The multi-stage image installs only
runtime dependencies and runs as the unprivileged `node` user.

The versioned `devops-interview-answer-v4` plan calibrates answer depth to the
question. Direct definitions stay concise; applied modes move from principle to
practical operation and verification. The runtime quality gate warns on an
applied answer that remains purely theoretical, and deterministic fixtures cover
the major DevOps interview question shapes.

## Checks

```bash
cd backend
npm ci
npm run lint
npm test
npm run build
```

To include the real PostgreSQL repository test, start the Compose PostgreSQL
service, apply migrations, then run the targeted spec with
`RUN_DATABASE_TESTS=true` and a matching host-accessible `DATABASE_URL`.
