# Agent Instructions

This repository is the source of truth for Agent Interview.

Before implementation, read all files under `docs/`.

## Current product scope

Only implement the DevOps interview role for V1.

The architecture must remain extensible to additional roles later.

## Required architecture

Extension:
- Chrome Manifest V3
- React
- Vite
- TypeScript
- Chrome Side Panel
- user-authorized tab capture
- chat UI
- SSE client
- audio segmentation/VAD

Backend:
- NestJS
- TypeScript
- PostgreSQL
- optional Redis
- provider abstraction for STT
- provider abstraction for LLM
- Interview Intelligence Layer
- SSE streaming
- Swagger/OpenAPI
- structured logging
- health endpoints

## Separation of responsibilities

Extension:
- UI
- capture
- local session state
- audio transport
- stream rendering

Backend:
- authentication/authorization if enabled
- STT
- question classification
- context construction
- prompt orchestration
- LLM
- validation
- persistence
- metrics/logging
- provider secrets

Never put AI provider API keys in the extension.

## Implementation rules

- Implement one roadmap phase at a time.
- Keep provider-specific SDK code behind interfaces.
- Do not add LangChain by default.
- Do not store raw interview audio by default.
- Do not claim production readiness without passing release checklist.
- Run lint, tests, build and integration checks before completion.
