# Agent Interview

Production-oriented documentation for a Chrome Extension interview copilot.

## Current scope

The product architecture is multi-role ready, but V1 supports only:

- DevOps Engineer

## Primary user flow

1. User opens an interview in a browser tab.
2. User opens the Agent Interview Chrome Side Panel.
3. User explicitly starts capture and selects the interview tab.
4. Extension captures the selected tab's audio.
5. Voice activity detection detects interviewer speech boundaries.
6. Audio is sent to the backend.
7. Speech-to-Text converts the utterance to text.
8. The transcript appears in the Side Panel chat.
9. The Interview Intelligence Layer classifies the question and builds context.
10. LLM answer generation starts automatically.
11. Answer tokens are streamed to the Side Panel using SSE.
12. The extension continues listening for the next question.

## Product principle

Listen -> Transcribe -> Understand -> Answer -> Continue.

## Curated DevOps knowledge

Interview-oriented knowledge cards for Linux, networking, Docker, Kubernetes,
AWS, Infrastructure as Code, Terraform, Git, CI/CD, Ansible, observability, and security are maintained in
[knowledge/devops](knowledge/README.md). Phase 10 indexes these cards into
pgvector through the explicit `npm run knowledge:index` job; see the deployment
guide before enabling retrieval in an environment.

## Important usage note

Use this product for mock interviews, practice, or interview sessions where AI
assistance is permitted.

## Local runtime

Use Docker Compose as the standard local runtime for the backend, PostgreSQL,
and Redis. Build the Chrome Extension on the host so it can be loaded and
reloaded by Chrome.

The backend now persists interview history and includes the Phase 9 self-hosted
hardening boundary: per-session authorization, Redis rate limiting, strict
production configuration, protected metrics, non-root runtime image, and
backup/restore tooling. TLS, identity-aware public access, managed secrets, and
scheduled restore-tested backups remain deployment responsibilities.

To produce a loadable extension, run `npm ci && npm run build` from
`extension/`, then load `extension/dist` as an unpacked extension in
`chrome://extensions`.

For the complete environment setup, provider configuration, CORS handshake,
end-to-end usage, production prerequisites, smoke test, and rollback procedure,
follow [the deployment and operation guide](docs/08-deployment.md).

## Read order

1. `docs/00-product-scope.md`
2. `docs/01-system-architecture.md`
3. `docs/02-extension-architecture.md`
4. `docs/03-audio-pipeline.md`
5. `docs/04-interview-intelligence-layer.md`
6. `docs/05-api-contract.md`
7. `docs/06-data-model.md`
8. `docs/07-security-privacy.md`
9. `docs/08-deployment.md`
10. `docs/09-observability.md`
11. `docs/10-testing.md`
12. `docs/11-runbook.md`
13. `docs/12-release-checklist.md`
14. `docs/13-roadmap.md`
