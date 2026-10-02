# Implementation Prompts

## Phase 1 prompt

Read all documentation in this repository.

Implement only Phase 1 from `docs/13-roadmap.md`.

Current role: DevOps only.

Build:
- NestJS
- Swagger
- `/health/live`
- `/health/ready`
- Interview module
- Interview Intelligence Layer skeleton
- DevOps role config
- question classifier
- prompt builder
- LLM provider interface
- mock LLM provider
- one real provider integration (OpenAI Responses API, configured through backend environment variables)
- manual text question endpoint
- SSE streamed answer
- error model
- unit tests

Do not implement:
- extension audio
- STT
- VAD
- RAG
- CV/JD
- other roles

Run lint, tests and build.

## Phase 2 prompt

Implement only Phase 2.

Build Chrome Manifest V3 extension:
- React/Vite/TypeScript
- Side Panel
- session start/end
- chat UI
- manual dev question
- SSE client
- status/error states

Do not implement audio capture yet.

## Phase 3 prompt

Implement only Phase 3.

Add explicit user-authorized tab audio capture.

Requirements:
- select active interview tab
- capture audio track
- Start/Stop
- state display
- stream cleanup
- no provider keys
- no STT yet

## Phase 4/5 prompt

Add VAD, segmentation and STT according to docs.

Final transcript must appear as interviewer chat message.

## Phase 6 prompt

On successful final transcript:
- automatically invoke Interview Intelligence Layer
- stream answer through SSE
- create AI Assistant chat bubble
- do not require Send button
