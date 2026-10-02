# Deployment

## Environments

- local
- staging
- production

## Local

```text
Extension dev server -> http://localhost:5173
Backend -> http://localhost:3000
Backend -> Docker Compose PostgreSQL/Redis
```

Docker Compose is the standard local runtime. It must provide the backend, PostgreSQL, and optional Redis services on a shared Compose network. The backend source may be bind-mounted or rebuilt for local development, but provider secrets must be supplied only through an uncommitted local environment file.

The Chrome extension should run from the host with Vite during development, because it must be loaded by Chrome and benefit from browser-facing hot reload. It connects to the backend through the mapped localhost API port.

The root `docker-compose.yml` supports:

- `docker compose up --build` to start the complete backend dependency stack
- persistent PostgreSQL data in a named volume
- backend startup that depends on PostgreSQL and Redis readiness, plus a backend liveness health check
- a documented `.env.example`, with no real secrets committed

## Production reference architecture

```text
Chrome Extension
      |
      | HTTPS
      v
Reverse Proxy / Load Balancer
      |
      v
NestJS Backend
      |
      +--> PostgreSQL
      +--> Redis optional
      +--> STT provider
      +--> LLM provider
```

## Backend deployment options

Good V1 options:
- single VM + Docker Compose
- ECS/Fargate
- Kubernetes only if operationally justified

Do not use Kubernetes only for portfolio value.

## Required environment variables

```text
NODE_ENV
PORT
DATABASE_URL

LLM_PROVIDER
LLM_API_KEY
LLM_MODEL
LLM_TIMEOUT_MS

STT_PROVIDER
STT_API_KEY
STT_MODEL
STT_TIMEOUT_MS
STT_MAX_AUDIO_BYTES
STT_MAX_DURATION_MS

REDIS_URL

CORS_ORIGINS
AUTH_SECRET
LOG_LEVEL
```

## Phase 1 LLM integration

`LLM_PROVIDER=mock` is the credential-free local default. `LLM_PROVIDER=openai` uses the official OpenAI JavaScript SDK on the backend only, with the Responses API, `stream: true`, a configurable timeout, and `store: false`. The backend forwards only text deltas to the extension through its own SSE endpoint. See the [official OpenAI streaming guide](https://developers.openai.com/api/docs/guides/streaming-responses).

## Phase 5 STT integration

`STT_PROVIDER=mock` is the credential-free local default. `STT_PROVIDER=openai`
uses `STT_API_KEY` and `STT_MODEL` only in the NestJS process; never add either
to the extension environment. Audio upload limits are configured through
`STT_MAX_AUDIO_BYTES` and `STT_MAX_DURATION_MS`. Reverse proxies must accept a
request body at least as large as the configured audio limit.

## Reverse proxy

Requirements:
- TLS
- SSE-friendly buffering disabled
- long enough read timeout for streams
- request body limit for audio segment uploads

## Database

Production:
- backups
- migration process
- connection pooling
- restricted credentials

## Extension build

Use distinct environment builds:
- development
- production

Never bundle backend provider secrets.

The Phase 2 extension accepts only `VITE_API_BASE_URL` (default `http://localhost:3000/api/v1`). This is a public backend URL, not a secret. Its Chrome `host_permissions` value must be kept narrowly scoped to the matching API origin for each build.

For local extension testing, replace `YOUR_EXTENSION_ID` in the backend `CORS_ORIGINS` value with the ID assigned by Chrome after loading `extension/dist`, then restart the backend. This allows both REST and EventSource requests from the Side Panel.
