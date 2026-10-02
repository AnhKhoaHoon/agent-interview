# Release Checklist

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

## AI

- [ ] DevOps role prompt versioned
- [ ] classifier tested
- [ ] conversation context bounded
- [ ] no invented candidate experience
- [ ] answer length bounded
- [ ] fallback for empty/bad output
- [ ] mock and real provider tests pass

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
