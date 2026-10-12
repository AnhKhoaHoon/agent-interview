# Release Checklist

Phases 9 and 10 supply automated evidence for request validation, health/readiness,
database migrations and restart persistence, interview bearer enforcement,
protected metrics, Redis rate counters, provider timeout/retry configuration,
structured logs, non-retention of raw audio, lint, tests, builds, and production
dependency audit. Keep the boxes below environment-specific: code existing does
not prove TLS, secret injection, backup scheduling/restore, Chrome Web Store
review, real-provider quality, or live SLOs for a deployment.

## Extension

- [ ] Manifest V3 valid
- [ ] minimum required permissions only
- [ ] Start capture requires explicit action
- [ ] Stop capture releases tracks
- [ ] Side Panel survives normal navigation
- [ ] no provider secrets in bundle
- [ ] production API URL configured
- [ ] dev controls removed/hidden
- [ ] error states usable
- [ ] reconnect behavior tested

## Backend

- [ ] HTTPS configured
- [ ] strict CORS
- [ ] Swagger disabled or protected if required
- [ ] health endpoints available
- [ ] request validation enabled
- [ ] rate limit enabled if externally accessible
- [ ] secrets injected securely
- [ ] database migrations applied
- [ ] database backup configured
- [ ] provider timeout configured
- [ ] retry policy configured
- [ ] structured logs enabled
- [ ] raw audio not retained by default
- [ ] pgvector migration applied when RAG is enabled
- [ ] knowledge index run after the approved knowledge revision
- [ ] candidate profile/JD retention reviewed for the local user
- [ ] CI verifies lint, tests, and build before deployment
- [ ] deployment environment restricts branch access and protects SSH secrets
- [ ] server pulls an immutable image digest or commit-SHA tag, not a mutable tag
- [ ] server readiness and knowledge-index outcome are verified after deployment

## AI

- [ ] each enabled role prompt versioned and tested
- [ ] role selector is locked after session creation and role-scoped RAG is verified
- [ ] classifier tested
- [ ] conversation context bounded
- [ ] no invented candidate experience
- [ ] answer length bounded
- [ ] fallback for empty/bad output
- [ ] test-double and real-provider tests pass
- [ ] RAG relevance threshold reviewed; low-confidence retrieval falls back
- [ ] embedding credentials remain backend-only
- [ ] profile facts are used only as verified evidence; missing experience uses
  an adaptable answer

## Performance

- [ ] speech-end -> first answer measured
- [ ] STT latency measured
- [ ] first token latency measured
- [ ] p95 latency reviewed

## Privacy

- [ ] privacy notice written
- [ ] audio retention behavior documented
- [ ] user can stop capture immediately
- [ ] history deletion path defined
- [ ] CV/JD raw files discarded after extraction and profile/JD text deletion
  path defined
